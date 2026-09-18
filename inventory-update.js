(function(){
  var prices = {
    "Whole House Fumigation Cape Town": "R850",
    "Bed Bug Treatment Cape Town": "R800",
    "Cockroach Control Cape Town": "R750",
    "Rat & Mice Control Cape Town": "R800",
    "Ant Extermination Cape Town": "R850",
    "Yard Spraying Cape Town": "R800"
  };
  document.querySelectorAll(".service-card").forEach(function(card){
    var title = card.querySelector(".service-title");
    var price = card.querySelector(".service-price span");
    if(title && price && prices[title.textContent.trim()]){
      var p = prices[title.textContent.trim()];
      price.textContent = p;
      price.setAttribute("content", p.replace(/[^\d]/g,""));
    }
  });
  var grid = document.querySelector(".services-grid");
  if(!grid || document.querySelector('[data-service="Termite Treatment"]')) return;
  var cards = `
            <div class="service-card" role="listitem" itemscope itemtype="https://schema.org/Service">
                <div class="service-image-container"><img src="images/termite.svg" alt="Termite treatment Cape Town" class="service-image" width="400" height="250" loading="lazy"></div>
                <div class="service-header" style="background-color: #8B4513"><div class="service-icon" aria-hidden="true">🪵</div><h3 class="service-title" itemprop="name">Termite Treatment Cape Town</h3><div class="service-price" itemprop="offers" itemscope itemtype="https://schema.org/Offer"><span itemprop="price" content="1000">from R1000</span><meta itemprop="priceCurrency" content="ZAR"></div></div>
                <div class="service-body"><p itemprop="description">Professional termite inspection and treatment across Cape Town. We protect your property's timber structure with targeted treatments and long-term monitoring options.</p><ul class="service-features"><li><i class="fas fa-check" aria-hidden="true"></i> Full property inspection</li><li><i class="fas fa-check" aria-hidden="true"></i> Targeted termite treatment</li><li><i class="fas fa-check" aria-hidden="true"></i> Wood &amp; structure protection</li><li><i class="fas fa-check" aria-hidden="true"></i> Follow-up monitoring available</li></ul><a href="contact.html" class="btn btn-primary service-btn" data-service="Termite Treatment" aria-label="Book Termite Treatment Cape Town">Book This Service</a></div>
            </div>
            <div class="service-card" role="listitem" itemscope itemtype="https://schema.org/Service">
                <div class="service-image-container"><img src="images/snake.svg" alt="Snake removal Cape Town" class="service-image" width="400" height="250" loading="lazy"></div>
                <div class="service-header" style="background-color: #2c3e50"><div class="service-icon" aria-hidden="true">🐍</div><h3 class="service-title" itemprop="name">Snake Removal Cape Town</h3><div class="service-price" itemprop="offers" itemscope itemtype="https://schema.org/Offer"><span itemprop="price" content="1500">from R1500</span><meta itemprop="priceCurrency" content="ZAR"></div></div>
                <div class="service-body"><p itemprop="description">Safe, professional snake removal and relocation in Cape Town. Our trained technicians handle venomous and non-venomous snakes with minimal stress to the animal and your household.</p><ul class="service-features"><li><i class="fas fa-check" aria-hidden="true"></i> Safe capture &amp; relocation</li><li><i class="fas fa-check" aria-hidden="true"></i> Venomous &amp; non-venomous</li><li><i class="fas fa-check" aria-hidden="true"></i> Rapid response available</li><li><i class="fas fa-check" aria-hidden="true"></i> Advice on prevention</li></ul><a href="contact.html" class="btn btn-primary service-btn" data-service="Snake Removal" aria-label="Book Snake Removal Cape Town">Book This Service</a></div>
            </div>`;
  grid.insertAdjacentHTML("beforeend", cards);
})();
