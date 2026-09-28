// Sorelly Admin · kits novos Curitiba — lib/bridge-montagem.js
//
// Ponte de protótipo entre os dois apps: ainda não existe backend, cada um
// guarda seu próprio estado no localStorage do navegador. Direcionar um kit
// novo pra representante aqui escreve direto na lista `novas` que o admin de
// montagem (Kits → Kits novos, e o app da representante) já lê e sabe tratar
// (aceitar, recusar, colocar na listagem). Quando existir uma API de verdade
// ligando cadastro e montagem, isso vira uma chamada normal em vez de mexer
// no localStorage do outro app.
//
// Precisa bater com a chave e o formato de `novas` em
// @/apps/montagem/state/store.js (CHAVE) e domain/representantes.js (NOVAS0).
const CHAVE_MONTAGEM = "sorelly_montagem_v9";

function hojeCurto() {
  var d = new Date();
  return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0");
}

/** Direciona um kit novo (já liberado) pra uma representante no app de montagem. */
export function direcionarParaRepresentante(c, rep) {
  try {
    var raw = localStorage.getItem(CHAVE_MONTAGEM);
    if (!raw) return false;
    var s = JSON.parse(raw);
    if (!s || s.v !== 4) return false;
    var id = "KN" + c.id;
    var novas = (s.novas || []).filter(function (n) { return n.id !== id; });
    novas.unshift({
      id: id,
      nome: c.nome,
      cidade: c.cid || "",
      bairro: c.bai || "",
      valor: c.val || 0,
      expositor: false,
      rep: rep,
      status: "direcionada",
      cadastro: hojeCurto(),
    });
    s.novas = novas;
    localStorage.setItem(CHAVE_MONTAGEM, JSON.stringify(s));
    return true;
  } catch (x) {
    return false;
  }
}

/** true se o app de montagem já tem estado salvo neste navegador (pra avisar quando a ponte não vai funcionar). */
export function montagemDisponivel() {
  try { return !!localStorage.getItem(CHAVE_MONTAGEM); } catch (x) { return false; }
}

export { CHAVE_MONTAGEM };
