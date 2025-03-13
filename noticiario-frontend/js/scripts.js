// Função para carregar notícias na página noticias.html
async function carregarNoticias() {
    try {
        const response = await fetch('http://localhost:3000/noticias');
        const noticias = await response.json();
        const gridNoticias = document.querySelector('.grid-noticias');

        // Limpa o contêiner antes de adicionar novas notícias
        gridNoticias.innerHTML = '';

        // Itera sobre as notícias e cria os elementos HTML
        noticias.forEach(noticia => {
            const article = document.createElement('article');
            article.classList.add('noticia');
            article.innerHTML = `
                <img src="${noticia.imagem}" alt="${noticia.titulo}">
                <h3><a href="noticia.html?id=${noticia.id}">${noticia.titulo}</a></h3>
                <p>${noticia.conteudo}</p>
                <span class="categoria">${noticia.categoria}</span>
                <span class="data">${new Date(noticia.data).toLocaleDateString()}</span>
            `;
            gridNoticias.appendChild(article);
        });
    } catch (error) {
        console.error('Erro ao carregar notícias:', error);
    }
}

// Função para carregar os detalhes de uma notícia na página noticia.html
async function carregarNoticia() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const noticiaDetalhes = document.getElementById('noticia-detalhes');

    if (!id) {
        noticiaDetalhes.innerHTML = `<p>Notícia não encontrada.</p>`;
        return;
    }

    // Exibir spinner de carregamento
    noticiaDetalhes.innerHTML = `<div class="spinner">Carregando...</div>`;

    try {
        const response = await fetch(`http://localhost:3000/noticias/${id}`);
        if (!response.ok) {
            throw new Error('Notícia não encontrada');
        }
        const noticia = await response.json();

        noticiaDetalhes.innerHTML = `
            <h2>${noticia.titulo}</h2>
            <img src="${noticia.imagem}" alt="${noticia.titulo}">
            <p>${noticia.conteudo}</p>
            <span class="categoria">Categoria: ${noticia.categoria}</span>
            <span class="data">Publicado em: ${new Date(noticia.data).toLocaleDateString()}</span>
        `;
    } catch (error) {
        console.error('Erro ao carregar notícia:', error);
        noticiaDetalhes.innerHTML = `
            <p>Erro ao carregar a notícia. Tente novamente mais tarde.</p>
            <p>Detalhes do erro: ${error.message}</p>
        `;
    }
}

// Função para adicionar uma notícia no painel de administração
document.getElementById('form-noticia')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    if (!data.titulo || !data.conteudo || !data.imagem || !data.categoria) {
        alert('Todos os campos são obrigatórios.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/noticias', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            alert('Notícia adicionada com sucesso!');
            e.target.reset(); // Limpar formulário
        } else {
            const error = await response.json();
            alert(`Erro ao adicionar notícia: ${error.error}`);
        }
    } catch (error) {
        console.error('Erro ao adicionar notícia:', error);
        alert('Erro ao adicionar notícia. Verifique o console para mais detalhes.');
    }
});

// Carrega as notícias ou os detalhes da notícia, dependendo da página
if (window.location.pathname.includes('noticias.html')) {
    carregarNoticias();
} else if (window.location.pathname.includes('noticia.html')) {
    carregarNoticia();
}