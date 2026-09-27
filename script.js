// Troque pelo número real da pizzaria (DDI + DDD + número, só dígitos)
const WHATSAPP = "5511968741917";

// dia da semana (0 = domingo) -> [abre, fecha] em horas. Segunda fechado.
const HORARIOS = { 0: [18, 23], 2: [18, 23], 3: [18, 23], 4: [18, 23], 5: [18, 23], 6: [18, 23] };

const CARDAPIO = [
  { id: "margherita", nome: "Margherita", categoria: "salgada", preco: 52, desc: "Molho de tomate, muçarela de búfala, manjericão e azeite.", tag: "Mais pedida" },
  { id: "calabresa", nome: "Calabresa da Vila", categoria: "salgada", preco: 49, desc: "Calabresa artesanal, cebola roxa, azeitona preta e orégano." },
  { id: "pistache", nome: "Mortadela e Pistache", categoria: "salgada", preco: 64, desc: "Mortadela italiana, burrata, pistache torrado e raspas de limão.", tag: "Da casa" },
  { id: "quatro-queijos", nome: "Quatro Queijos", categoria: "salgada", preco: 58, desc: "Muçarela, gorgonzola, parmesão e provolone defumado." },
  { id: "portuguesa", nome: "Portuguesa", categoria: "salgada", preco: 55, desc: "Presunto, ovo, cebola, ervilha fresca, azeitona e muçarela." },
  { id: "abobrinha", nome: "Abobrinha e Ricota", categoria: "salgada", preco: 51, desc: "Abobrinha assada, ricota temperada, hortelã e nozes.", tag: "Vegetariana" },
  { id: "nutella", nome: "Nutella e Morango", categoria: "doce", preco: 48, desc: "Creme de avelã, morangos frescos e açúcar de confeiteiro." },
  { id: "banana", nome: "Banana com Canela", categoria: "doce", preco: 42, desc: "Banana, doce de leite, canela e crocante de castanha." },
  { id: "refri", nome: "Refrigerante lata", categoria: "bebida", preco: 7, desc: "Coca-Cola, Guaraná ou Sprite. 350 ml." },
  { id: "suco", nome: "Suco natural", categoria: "bebida", preco: 12, desc: "Laranja, limão ou maracujá. 500 ml." },
];

const carrinho = new Map(); // id -> quantidade
const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function linkWhatsApp(mensagem) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
}

// ---------- Status aberto/fechado ----------
function atualizarStatus() {
  const el = document.querySelector(".js-status");
  const agora = new Date();
  const horario = HORARIOS[agora.getDay()];
  const hora = agora.getHours();
  const aberto = horario && hora >= horario[0] && hora < horario[1];

  el.classList.toggle("aberto", Boolean(aberto));
  el.classList.toggle("fechado", !aberto);
  el.textContent = aberto
    ? `Aberto agora · até ${horario[1]}h`
    : "Fechado agora · abrimos às 18h (ter a dom)";
}

// ---------- Cardápio ----------
function renderizarCardapio(categoria = "todas") {
  const lista = document.querySelector(".js-cardapio");
  const itens = CARDAPIO.filter((i) => categoria === "todas" || i.categoria === categoria);

  lista.innerHTML = itens.map((item) => `
    <article class="item">
      ${item.tag ? `<span class="item__tag">${item.tag}</span>` : ""}
      <div class="item__topo">
        <h3>${item.nome}</h3>
        <span class="item__preco">${moeda.format(item.preco)}</span>
      </div>
      <p>${item.desc}</p>
      <div class="contador" data-id="${item.id}">
        <button type="button" data-acao="menos" aria-label="Remover ${item.nome}">−</button>
        <output aria-label="Quantidade">${carrinho.get(item.id) || 0}</output>
        <button type="button" data-acao="mais" aria-label="Adicionar ${item.nome}">+</button>
      </div>
    </article>
  `).join("");
}

function alterarQuantidade(id, delta) {
  const nova = Math.max(0, (carrinho.get(id) || 0) + delta);
  nova ? carrinho.set(id, nova) : carrinho.delete(id);

  const contador = document.querySelector(`.contador[data-id="${id}"] output`);
  if (contador) contador.textContent = nova;
  atualizarCarrinho();
}

// ---------- Carrinho ----------
function itensDoCarrinho() {
  return [...carrinho].map(([id, qtd]) => ({ ...CARDAPIO.find((i) => i.id === id), qtd }));
}

function atualizarCarrinho() {
  const itens = itensDoCarrinho();
  const qtd = itens.reduce((soma, i) => soma + i.qtd, 0);
  const total = itens.reduce((soma, i) => soma + i.qtd * i.preco, 0);

  document.querySelector(".js-carrinho").hidden = qtd === 0;
  document.querySelector(".js-carrinho-qtd").textContent = `${qtd} ${qtd === 1 ? "item" : "itens"}`;
  document.querySelector(".js-carrinho-total").textContent = moeda.format(total);
}

function mensagemDoPedido() {
  const itens = itensDoCarrinho();
  const linhas = itens.map((i) => `• ${i.qtd}x ${i.nome}: ${moeda.format(i.qtd * i.preco)}`);
  const total = itens.reduce((soma, i) => soma + i.qtd * i.preco, 0);
  return [
    "Olá! Quero fazer um pedido 🍕",
    "",
    ...linhas,
    "",
    `*Total: ${moeda.format(total)}*`,
    "",
    "Endereço de entrega: ",
  ].join("\n");
}

// ---------- Eventos ----------
document.querySelector(".js-cardapio").addEventListener("click", (e) => {
  const botao = e.target.closest("button[data-acao]");
  if (!botao) return;
  const id = botao.closest(".contador").dataset.id;
  alterarQuantidade(id, botao.dataset.acao === "mais" ? 1 : -1);
});

document.querySelectorAll(".filtro").forEach((filtro) => {
  filtro.addEventListener("click", () => {
    document.querySelectorAll(".filtro").forEach((f) => {
      f.classList.toggle("ativo", f === filtro);
      f.setAttribute("aria-selected", f === filtro);
    });
    renderizarCardapio(filtro.dataset.categoria);
  });
});

document.querySelector(".js-enviar-pedido").addEventListener("click", () => {
  window.open(linkWhatsApp(mensagemDoPedido()), "_blank", "noopener");
});

document.querySelector(".js-limpar").addEventListener("click", () => {
  carrinho.clear();
  document.querySelectorAll(".contador output").forEach((o) => (o.textContent = 0));
  atualizarCarrinho();
});

document.querySelectorAll(".js-whatsapp").forEach((link) => {
  link.href = linkWhatsApp("Olá! Vim pelo site do Forno da Vila e gostaria de fazer um pedido.");
  link.target = "_blank";
  link.rel = "noopener";
});

// Menu do celular
const menuBotao = document.querySelector(".menu-botao");
const nav = document.querySelector(".nav");
menuBotao.addEventListener("click", () => {
  const aberto = nav.classList.toggle("aberto");
  menuBotao.setAttribute("aria-expanded", aberto);
});
nav.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    nav.classList.remove("aberto");
    menuBotao.setAttribute("aria-expanded", false);
  }
});

renderizarCardapio();
atualizarStatus();
