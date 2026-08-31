/* Каталог продукции FRESCONTI
   Источники: сайт производителя https://zar-sol.ru/ («Царицынские соленья»)
   и витрина бренда на Wildberries https://www.wildberries.ru/brands/310930370-fresconti
   Изображения — с сайта производителя (лежат локально в assets/img/). */
window.GLOBAL = {
  brand: {
    name: 'FRESCONTI',
    tagline: 'Премиальные соленья и маринады',
    about: 'FRESCONTI — бренд продукции премиального качества, привлекающий внимание ярким дизайном и по-настоящему уникальной палитрой вкусов. Соусы без сахара, овощи в масле, соленья и конфитюры, созданные по итальянским и средиземноморским рецептам.',
    manufacturer: 'ООО «Царицынские соленья» — молодое современное предприятие (осн. 2016, г. Волжский). Собственная сырьевая база, продукция представлена в более чем 50 000 торговых точек по всей России и входит в пятёрку крупнейших производителей СТМ для сторонних заказчиков.',
    site: 'https://zar-sol.ru/',
    wbBrand: 'https://www.wildberries.ru/brands/310930370-fresconti',
    wbSearch: 'https://www.wildberries.ru/catalog/0/search.aspx?search=fresconti',
    phone: '+7 (8442) 609-277',
    email: 'info@zar-sol.ru',
    address: '404130, Волгоградская обл., г. Волжский, 1-й Базовый проезд, 5'
  },

  categories: [
    { id: 'all',     name: 'Все',         emoji: '✦' },
    { id: 'sousy',   name: 'Соусы',       emoji: '🍅' },
    { id: 'antipasti', name: 'Антипасти', emoji: '🫒' },
    { id: 'solenya', name: 'Соленья',     emoji: '🥒' },
    { id: 'ostroe',  name: 'Острое',      emoji: '🌶️' },
    { id: 'konfityury', name: 'Конфитюры', emoji: '🍊' },
    { id: 'konservy', name: 'Консервы',   emoji: '🥫' }
  ],

  /* wb: прямая ссылка на карточку Wildberries; null — ссылаемся на бренд-страницу.
     rating/reviews: соц-доказательство с витрины WB (показывается при reviews >= 3). */
  products: [
    // ——— Соусы (без сахара) ———
    { id: 'arabiata-ns', name: 'Соус «Арабьята» без сахара', vol: '350 мл', cat: 'sousy',
      img: 'assets/img/arabiata-ns.webp', wb: 'https://www.wildberries.ru/catalog/175735317/detail.aspx',
      rating: 4.0, reviews: 51, desc: 'Острый томатный соус в итальянском стиле. Без добавленного сахара — низкокалорийный кетчуп для пасты, пиццы и мяса.' },
    { id: 'baziliko-ns', name: 'Соус «Базилико» без сахара', vol: '350 мл', cat: 'sousy',
      img: 'assets/img/baziliko-ns.webp', wb: 'https://www.wildberries.ru/catalog/175986600/detail.aspx',
      rating: 5.0, reviews: 64, desc: 'Томатный соус с ароматным базиликом. Без добавленного сахара, плотная текстура — идеален для пасты и лазаньи.' },
    { id: 'italiano-ns', name: 'Соус «Итальяно» без сахара', vol: '350 мл', cat: 'sousy',
      img: 'assets/img/italiano-ns.webp', wb: 'https://www.wildberries.ru/catalog/176005944/detail.aspx',
      rating: 5.0, reviews: 39, desc: 'Классический итальянский томатный соус без сахара. Универсальная основа для блюд средиземноморской кухни.' },
    { id: 'tomato-ns', name: 'Соус «Томато» без сахара', vol: '350 мл', cat: 'sousy',
      img: 'assets/img/tomato-ns.webp', wb: 'https://www.wildberries.ru/catalog/176008099/detail.aspx',
      rating: 5.0, reviews: 23, desc: 'Насыщенный томатный соус из спелых томатов. Без добавленного сахара — чистый вкус томатов.' },

    // ——— Антипасти и в масле ———
    { id: 'baklazhany-chesnok', name: 'Баклажаны вяленые с чесноком', vol: '180 мл', cat: 'antipasti',
      img: 'assets/img/baklazhany-chesnok.png', wb: 'https://www.wildberries.ru/catalog/1015222557/detail.aspx',
      rating: 5.0, reviews: 5, desc: 'Вяленые баклажаны с чесноком в ароматном масле. Готовая антипасти — к брускеттам, сырам и вину.' },
    { id: 'tomaty-vyalenye', name: 'Томаты вяленые в масле', vol: '200 мл', cat: 'antipasti',
      img: 'assets/img/tomaty-vyalenye.png', wb: 'https://www.wildberries.ru/catalog/210635059/detail.aspx',
      rating: 5.0, reviews: 76, desc: 'Вяленые томаты в ароматном масле. Классика средиземноморской кухни — для салатов, пасты и брускетт.' },
    { id: 'sliva-v-masle', name: 'Слива вяленая в масле', vol: '400 г', cat: 'antipasti',
      img: 'assets/img/sliva-v-masle.png', wb: 'https://www.wildberries.ru/catalog/1221150728/detail.aspx',
      rating: 5.0, reviews: 1, desc: 'Сладковатая вяленая слива в масле — изысканная закуска к сырам и мясу.' },
    { id: 'brusketta-olivki', name: 'Брускетта с оливками', vol: '110 мл', cat: 'antipasti',
      img: 'assets/img/brusketta-olivki.png', wb: 'https://www.wildberries.ru/catalog/1015259895/detail.aspx',
      rating: 5.0, reviews: 2, desc: 'Готовая намазка из вяленых томатов с оливками — для брускетт, сэндвичей и канапе.' },
    { id: 'brusketta-keshyu', name: 'Брускетта с кешью', vol: '110 мл', cat: 'antipasti',
      img: 'assets/img/brusketta-keshyu.png', wb: 'https://www.wildberries.ru/catalog/1015222548/detail.aspx',
      rating: 5.0, reviews: 7, desc: 'Намазка из вяленых томатов с орехами кешью — нежная текстура и насыщенный вкус.' },
    { id: 'chesnok', name: 'Чеснок маринованный зубками', vol: '125 мл', cat: 'antipasti',
      img: 'assets/img/chesnok.png', wb: 'https://www.wildberries.ru/catalog/1015228803/detail.aspx',
      rating: 5.0, reviews: 2, desc: 'Маринованный чеснок зубками — пряная закуска и украшение мясных блюд.' },

    // ——— Соленья и закуски ———
    { id: 'ogurchiki-medovye', name: 'Огурчики медовые', vol: '350 мл', cat: 'solenya',
      img: 'assets/img/ogurchiki-medovye.png', wb: null,
      desc: 'Хрустящие огурчики в медовом маринаде — фирменный сладко-пряный вкус.' },
    { id: 'ogurtsy-narezka', name: 'Огурчики маринованные (нарезка)', vol: '500 мл', cat: 'solenya',
      img: 'assets/img/ogurtsy-narezka.png', wb: 'https://www.wildberries.ru/catalog/1015222597/detail.aspx',
      desc: 'Маринованные огурчики-слайсы — удобная нарезка для салатов, бургеров и бутербродов.' },
    { id: 'kornishony-350', name: 'Корнишоны маринованные', vol: '350 мл', cat: 'solenya',
      img: 'assets/img/kornishony-350.png', wb: 'https://www.wildberries.ru/catalog/1345600977/detail.aspx',
      desc: 'Хрустящие корнишоны в пряном маринаде — классическая закуска и ингредиент для блюд.' },
    { id: 'kornishony-680', name: 'Огурчики пикантные', vol: '680 мл', cat: 'solenya',
      img: 'assets/img/kornishony-680.png', wb: null,
      desc: 'Пикантные маринованные огурчики — яркий, запоминающийся вкус.' },
    { id: 'morkov-koreyski', name: 'Морковь по-корейски', vol: '330 мл', cat: 'solenya',
      img: 'assets/img/morkov-koreyski.png', wb: null,
      desc: 'Сочная морковь по-корейски в пряном маринаде — готовая закуска к любому столу.' },
    { id: 'kimchi', name: 'Кимчи по-корейски', vol: '330 мл', cat: 'solenya',
      img: 'assets/img/kimchi.png', wb: null,
      desc: 'Острая кимчи по-корейски — ферментированная закуска с насыщенным вкусом.' },
    { id: 'relish', name: 'Релиш из солёных огурцов', vol: '350 мл', cat: 'solenya',
      img: 'assets/img/relish.png', wb: 'https://www.wildberries.ru/catalog/237409031/detail.aspx',
      rating: 5.0, reviews: 156, desc: 'Соус-релиш из солёных огурцов — хит бренда. Идеален к бургерам, хот-догам и мясу на гриле.' },
    { id: 'tomaty-ochishchennye', name: 'Томаты очищенные в соке', vol: '680 мл', cat: 'solenya',
      img: 'assets/img/tomaty-ochishchennye.png', wb: 'https://www.wildberries.ru/catalog/1015222552/detail.aspx',
      rating: 5.0, reviews: 4, desc: 'Целые очищенные томаты в собственном соку — основа для соусов, супов и рагу.' },

    // ——— Острое ———
    { id: 'khalapeno-krasnyy', name: 'Халапеньо красный с чесноком', vol: '200 мл', cat: 'ostroe',
      img: 'assets/img/khalapeno-krasnyy.png', wb: 'https://www.wildberries.ru/catalog/444546284/detail.aspx',
      rating: 5.0, reviews: 102, desc: 'Дроблёный красный халапеньо с чесноком в масле — острая приправа для пиццы, тако и бургеров.' },
    { id: 'khalapeno-zelenyy', name: 'Халапеньо зелёный', vol: '200 мл', cat: 'ostroe',
      img: 'assets/img/khalapeno-zelenyy.png', wb: null,
      desc: 'Дроблёный зелёный халапеньо в масле — сбалансированная острота с ярким вкусом.' },
    { id: 'khalapeno-350', name: 'Перец халапеньо маринованный', vol: '350 мл', cat: 'ostroe',
      img: 'assets/img/khalapeno-350.png', wb: 'https://www.wildberries.ru/catalog/176583087/detail.aspx',
      rating: 5.0, reviews: 72, desc: 'Маринованный перец халапеньо — острая закуска и ингредиент мексиканской кухни.' },

    // ——— Конфитюры и десерты ———
    { id: 'konfityur-limon', name: 'Конфитюр лимонный', vol: '200 мл', cat: 'konfityury',
      img: 'assets/img/konfityur-limon.png', wb: null,
      desc: 'Нежный лимонный конфитюр с яркой кислинкой — к выпечке, сырам и десертам.' },
    { id: 'konfityur-apelsin', name: 'Конфитюр апельсиновый', vol: '200 мл', cat: 'konfityury',
      img: 'assets/img/konfityur-apelsin.png', wb: 'https://www.wildberries.ru/catalog/440581647/detail.aspx',
      rating: 3.0, reviews: 4, desc: 'Ароматный апельсиновый конфитюр — для тостов, блинчиков и выпечки.' },
    { id: 'imbir-rozovyy', name: 'Имбирь розовый маринованный', vol: '200 мл', cat: 'konfityury',
      img: 'assets/img/imbir-rozovyy.png', wb: null,
      desc: 'Розовый маринованный имбирь (гари) — к суши, роллам и азиатским блюдам.' },
    { id: 'gorchitsa', name: 'Горчица «Фресконти»', vol: '200 мл', cat: 'konfityury',
      img: 'assets/img/gorchitsa.png', wb: null,
      desc: 'Пикантная горчица собственного рецепта — к мясу, колбасам и сэндвичам.' },

    // ——— Консервы ———
    { id: 'goroshek', name: 'Горошек зелёный', vol: '400 мл', cat: 'konservy',
      img: 'assets/img/goroshek.png', wb: null,
      desc: 'Нежный зелёный горошек отборного качества — для салатов и гарниров.' },
    { id: 'kukuruza', name: 'Кукуруза сладкая', vol: '400 мл', cat: 'konservy',
      img: 'assets/img/kukuruza.png', wb: null,
      desc: 'Сладкая кукуруза в зёрнах — для салатов, гарниров и закусок.' }
  ]
};
