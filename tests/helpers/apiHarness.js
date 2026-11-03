import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import vm from 'node:vm';

// Base aislada en memoria: ninguna prueba puede acceder a Supabase real.
export async function apiHarness(archivo, iniciales = {}, fallar = () => false, sustituciones = {}) {
  const tablas = structuredClone(iniciales);
  const operaciones = [];
  let secuencia = 1000;
  const cliente = {
    from(tabla) {
      let accion = 'select', valores, singular = false;
      const filtros = [], orden = [];
      let limite;
      const consulta = {
        select() { return this; },
        insert(datos) { accion = 'insert'; valores = datos; return this; },
        update(datos) { accion = 'update'; valores = datos; return this; },
        delete() { accion = 'delete'; return this; },
        eq(campo, valor) { filtros.push(r => String(r[campo]) === String(valor)); return this; },
        in(campo, lista) { filtros.push(r => lista.includes(r[campo])); return this; },
        ilike(campo, valor) {
          const patron = new RegExp('^' + valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replaceAll('%', '.*') + '$', 'i');
          filtros.push(r => patron.test(r[campo] || '')); return this;
        },
        order(campo, opciones = {}) { orden.push([campo, opciones.ascending !== false]); return this; },
        limit(valor) { limite = valor; return this; },
        single() { singular = true; return this; },
        maybeSingle() { singular = true; return this; },
        then(onResolve, onReject) {
          try {
            operaciones.push({ tabla, accion, valores: structuredClone(valores) });
            if (fallar({ tabla, accion, valores })) return Promise.resolve({ data: null, error: { message: 'Fallo simulado', code: 'TEST' } }).then(onResolve, onReject);
            tablas[tabla] ||= [];
            let filas = tablas[tabla].filter(r => filtros.every(f => f(r)));
            if (accion === 'insert') {
              const clave = tabla === 'requerimientos_propiedad' ? 'id_requerimiento' : tabla === 'reportes_meta_cm' ? 'id_reporte' : tabla === 'reportes_meta_anuncios' ? 'id_anuncio' : 'id_tarea';
              filas = (Array.isArray(valores) ? valores : [valores]).map(r => ({ [clave]: ++secuencia, ...r }));
              tablas[tabla].push(...filas);
            } else if (accion === 'update') {
              filas.forEach(r => Object.assign(r, valores));
            } else if (accion === 'delete') {
              tablas[tabla] = tablas[tabla].filter(r => !filas.includes(r));
            }
            for (const [campo, asc] of [...orden].reverse()) filas.sort((a, b) => (a[campo] > b[campo] ? 1 : a[campo] < b[campo] ? -1 : 0) * (asc ? 1 : -1));
            if (limite !== undefined) filas = filas.slice(0, limite);
            return Promise.resolve({ data: structuredClone(singular ? filas[0] || null : filas), error: null }).then(onResolve, onReject);
          } catch (error) { return Promise.reject(error).then(onResolve, onReject); }
        }
      };
      return consulta;
    }
  };
  const contexto = vm.createContext({ Response, Request, URL, console, setTimeout, clearTimeout, TextEncoder, TextDecoder });
  const cache = new Map();
  async function cargar(ruta) {
    if (cache.has(ruta)) return cache.get(ruta);
    const reemplazo = Object.entries(sustituciones).find(([sufijo]) => ruta.endsWith(sufijo))?.[1];
    if (reemplazo) {
      const modulo = new vm.SyntheticModule(Object.keys(reemplazo), function () {
        for (const [nombre, valor] of Object.entries(reemplazo)) this.setExport(nombre, valor);
      }, { context: contexto });
      cache.set(ruta, modulo);
      return modulo;
    }
    if (ruta.endsWith('supabaseServer.js')) {
      const modulo = new vm.SyntheticModule(['supabaseServer'], function () { this.setExport('supabaseServer', cliente); }, { context: contexto });
      cache.set(ruta, modulo);
      return modulo;
    }
    const modulo = new vm.SourceTextModule(await readFile(ruta, 'utf8'), { context: contexto, identifier: ruta });
    cache.set(ruta, modulo);
    await modulo.link((especificador) => cargar(resolve(dirname(ruta), especificador.endsWith('.js') ? especificador : especificador + '.js')));
    return modulo;
  }
  const modulo = await cargar(resolve(archivo));
  await modulo.evaluate();
  return {
    tablas, operaciones, exports: modulo.namespace,
    async llamar(metodo, datos, query = '') {
      const url = new URL('http://prueba.local/?' + query);
      const request = new Request(url, { method: metodo, ...(datos === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) }) });
      const response = await modulo.namespace[metodo]({ request, url });
      return { status: response.status, body: await response.json() };
    }
  };
}
