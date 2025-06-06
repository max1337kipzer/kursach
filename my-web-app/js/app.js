document.addEventListener('DOMContentLoaded', function() {
    const addCommentButtons = document.querySelectorAll('.add-comment.button');
    addCommentButtons.forEach(function(btn) {
        btn.addEventListener('click', function(event) {
            const card = event.currentTarget.closest('.card');
            const cardId = card.getAttribute('data-card');
            const input = card.querySelector('.comment-input');
            const comment = input.value.trim();
            if (!comment) {
                alert('Введите комментарий');
                return;
            }
            fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cardId, comment })
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    const commentList = card.querySelector('.comment-list');
                    const li = document.createElement('li');
                    li.textContent = comment;
                    commentList.appendChild(li);
                    input.value = '';
                }
            })
            .catch(() => alert('Ошибка при отправке комментария'));
        });
    });

    const likeButtons = document.querySelectorAll('.like-button');
    likeButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            button.classList.toggle('liked');
            if (button.classList.contains('liked')) {
                button.textContent = "Лайк (1)";
            } else {
                button.textContent = "Лайк";
            }
        });
    });

    const dislikeButtons = document.querySelectorAll('.dislike-button');
    dislikeButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            button.classList.toggle('disliked');
            if (button.classList.contains('disliked')) {
                button.textContent = "Дизлайк (1)";
            } else {
                button.textContent = "Дизлайк";
            }
        });
    });

    const achievementsList = document.getElementById('achievements-list');
    const achievementInput = document.getElementById('achievement-input');
    const addBtn = document.getElementById('add-achievement-btn');

    let achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
    achievements.forEach(addAchievementToDOM);

    function addAchievementToDOM(text) {
        const li = document.createElement('li');
        li.textContent = text;
        achievementsList.appendChild(li);
    }

    addBtn.addEventListener('click', function() {
        const text = achievementInput.value.trim();
        if (!text) return;
        achievements.push(text);
        localStorage.setItem('achievements', JSON.stringify(achievements));
        addAchievementToDOM(text);
        achievementInput.value = '';
    });

    achievementInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') addBtn.click();
    });

    const cardsContainer = document.querySelector('.cards-container');
    const portfolioImage = document.getElementById('portfolio-image');
    const portfolioDesc = document.getElementById('portfolio-desc');
    const addPortfolioBtn = document.getElementById('add-portfolio-btn');

    let userPortfolio = JSON.parse(localStorage.getItem('userPortfolio') || '[]');

    function renderUserPortfolio() {
        const allCards = cardsContainer.querySelectorAll('.card');
        allCards.forEach(card => {
            if (!card.hasAttribute('data-standard')) {
                card.remove();
            }
        });
        userPortfolio.forEach((item, idx) => addPortfolioCardToDOM(item, idx));
    }

    function addPortfolioCardToDOM({ image, desc, comments = [] }, idx) {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${image}" alt="Пользовательское портфолио">
            <h2>Моя работа</h2>
            <p>${desc}</p>
            <div class="comments">
                <ul class="comment-list"></ul>
                <input type="text" placeholder="Ваш комментарий" class="comment-input">
                <button class="add-comment button">Добавить комментарий</button>
            </div>
            <div class="feedback">
                <button class="like-button button">Лайк</button>
                <button class="dislike-button button">Дизлайк</button>
            </div>
        `;

        const currentUser = localStorage.getItem('currentUser') || '';
        if (currentUser === 'admin') {
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Удалить';
            deleteBtn.className = 'button';
            deleteBtn.style.margin = '10px';
            deleteBtn.style.background = 'red';
            deleteBtn.style.color = 'white';
            deleteBtn.style.fontWeight = 'bold';
            deleteBtn.onclick = function() {
                if (confirm('Удалить портфолио?')) {
                    userPortfolio.splice(idx, 1);
                    localStorage.setItem('userPortfolio', JSON.stringify(userPortfolio));
                    renderUserPortfolio();
                }
            };
            card.insertBefore(deleteBtn, card.firstChild);
        }

        const commentList = card.querySelector('.comment-list');
        const commentInput = card.querySelector('.comment-input');
        const addCommentBtn = card.querySelector('.add-comment');

        comments.forEach((text, cidx) => {
            const li = document.createElement('li');
            li.textContent = text;
            if (currentUser === 'admin') {
                const delCmtBtn = document.createElement('button');
                delCmtBtn.textContent = 'Удалить';
                delCmtBtn.className = 'button';
                delCmtBtn.style.marginLeft = '8px';
                delCmtBtn.onclick = function() {
                    const commentArr = userPortfolio[idx].comments;
                    const realIdx = commentArr.indexOf(text);
                    if (realIdx !== -1) {
                        commentArr.splice(realIdx, 1);
                        localStorage.setItem('userPortfolio', JSON.stringify(userPortfolio));
                        renderUserPortfolio();
                    }
                };
                li.appendChild(delCmtBtn);
            }
            commentList.appendChild(li);
        });

        addCommentBtn.onclick = function() {
            const text = commentInput.value.trim();
            if (!text) return;
            if (!userPortfolio[idx].comments) userPortfolio[idx].comments = [];
            userPortfolio[idx].comments.push(text);
            localStorage.setItem('userPortfolio', JSON.stringify(userPortfolio));
            renderUserPortfolio();
        };

        const likeBtn = card.querySelector('.like-button');
        const dislikeBtn = card.querySelector('.dislike-button');
        let liked = false, disliked = false;
        likeBtn.onclick = function() {
            liked = !liked;
            likeBtn.textContent = liked ? 'Лайк (1)' : 'Лайк';
            likeBtn.classList.toggle('liked', liked);
        };
        dislikeBtn.onclick = function() {
            disliked = !disliked;
            dislikeBtn.textContent = disliked ? 'Дизлайк (1)' : 'Дизлайк';
            dislikeBtn.classList.toggle('disliked', disliked);
        };

        cardsContainer.appendChild(card);
    }

    renderUserPortfolio();

    addPortfolioBtn.addEventListener('click', function() {
        const file = portfolioImage.files[0];
        const desc = portfolioDesc.value.trim();
        if (!file || !desc) return alert('Добавьте изображение и описание!');
        const reader = new FileReader();
        reader.onload = function(e) {
            const image = e.target.result;
            userPortfolio.push({ image, desc, comments: [] });
            localStorage.setItem('userPortfolio', JSON.stringify(userPortfolio));
            renderUserPortfolio();
            portfolioImage.value = '';
            portfolioDesc.value = '';
        };
        reader.readAsDataURL(file);
    });
});