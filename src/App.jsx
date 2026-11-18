import React, { useEffect, useMemo, useState } from 'react';

const initialProducts = [
  {
    id: 1,
    name: 'The Saanvi Co-ord',
    category: 'Ready to wear',
    price: 2890,
    stock: 12,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=85',
    tag: 'Bestseller',
  },
  {
    id: 2,
    name: 'Wildflower Silk Saree',
    category: 'Festive edit',
    price: 6490,
    stock: 8,
    image: 'https://images.unsplash.com/photo-1610189012906-4c3a6efb3aa7?auto=format&fit=crop&w=900&q=85',
    tag: 'Handwoven',
  },
  {
    id: 3,
    name: 'The Anya Blouse',
    category: 'Made for you',
    price: 1890,
    stock: 15,
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e3?auto=format&fit=crop&w=900&q=85',
    tag: 'Custom fit',
  },
  {
    id: 4,
    name: 'Sunday Linen Dress',
    category: 'Ready to wear',
    price: 3290,
    stock: 6,
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85',
    tag: 'New arrival',
  },
];

const defaultMeasurements = {
  shoulder: '',
  chest: '',
  waist: '',
  hip: '',
  sleeve: '',
  length: '',
};

const formatPrice = (price) => `₹${Number(price).toLocaleString('en-IN')}`;

function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 8h14l1 13H4L5 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

function App() {
  const [products, setProducts] = useStoredState('lizona-products', initialProducts);
  const [cart, setCart] = useStoredState('lizona-cart', []);
  const [user, setUser] = useStoredState('lizona-user', null);
  const [customerData, setCustomerData] = useStoredState('lizona-customers', {});
  const [activeModal, setActiveModal] = useState('');
  const [activeCategory, setActiveCategory] = useState('All pieces');
  const [notice, setNotice] = useState('');
  const [authMode, setAuthMode] = useState('register');
  const measurements = user ? customerData[user.email]?.measurements || defaultMeasurements : defaultMeasurements;
  const orders = user ? customerData[user.email]?.orders || [] : [];

  const visibleProducts = useMemo(
    () => activeCategory === 'All pieces'
      ? products
      : products.filter((product) => product.category === activeCategory),
    [activeCategory, products],
  );
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function addToCart(product) {
    setCart((items) => {
      const existing = items.find((item) => item.id === product.id);
      if (existing) {
        return items.map((item) => item.id === product.id
          ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
          : item);
      }
      return [...items, { ...product, quantity: 1 }];
    });
    setNotice(`${product.name} added to your bag`);
  }

  function updateQuantity(productId, amount) {
    setCart((items) => items
      .map((item) => item.id === productId
        ? { ...item, quantity: Math.min(item.quantity + amount, item.stock) }
        : item)
      .filter((item) => item.quantity > 0));
  }

  function signIn(formData) {
    const email = formData.get('email').toString().trim().toLowerCase();
    const name = formData.get('name')?.toString().trim() || email.split('@')[0];
    const role = email.toLowerCase() === 'admin@lizona-boutique.com' ? 'admin' : 'customer';
    const nextUser = { name, email, role, phone: formData.get('phone')?.toString().trim() || '' };
    setUser(nextUser);
    setActiveModal('');
    setNotice(`Welcome${role === 'admin' ? ' back, admin' : `, ${name}`}!`);
  }

  function saveMeasurements(event) {
    event.preventDefault();
    const nextMeasurements = Object.fromEntries(new FormData(event.currentTarget).entries());
    setCustomerData((previous) => ({
      ...previous,
      [user.email]: { ...previous[user.email], measurements: nextMeasurements },
    }));
    setActiveModal('');
    setNotice('Your measurements have been saved');
  }

  function completeCheckout(event) {
    event.preventDefault();
    if (!cart.length) return;
    const formData = new FormData(event.currentTarget);
    const order = {
      id: `MR-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString('en-IN'),
      total: cartTotal,
      items: cart.map(({ id, name, quantity, price }) => ({ id, name, quantity, price })),
      address: formData.get('address'),
      measurements: { ...measurements },
    };
    setCustomerData((previous) => ({
      ...previous,
      [user.email]: { ...previous[user.email], orders: [order, ...(previous[user.email]?.orders || [])] },
    }));
    setProducts((previous) => previous.map((product) => {
      const purchased = cart.find((item) => item.id === product.id);
      return purchased ? { ...product, stock: Math.max(0, product.stock - purchased.quantity) } : product;
    }));
    setCart([]);
    setActiveModal('');
    setNotice(`Order ${order.id} placed — thank you!`);
  }

  function saveProduct(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const product = {
      id: Date.now(),
      name: data.get('name').toString().trim(),
      category: data.get('category').toString(),
      price: Number(data.get('price')),
      stock: Number(data.get('stock')),
      image: data.get('image').toString().trim() || initialProducts[0].image,
      tag: 'New arrival',
    };
    setProducts((previous) => [product, ...previous]);
    setActiveModal('');
    setNotice('New piece added to your collection');
  }

  function updateProduct(event, productId) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setProducts((previous) => previous.map((product) => product.id === productId
      ? {
        ...product,
        price: Number(data.get('price')),
        stock: Number(data.get('stock')),
        image: data.get('image').toString().trim() || product.image,
      }
      : product));
    setNotice('Your product details have been updated');
  }

  return (
    <div className="site-shell">
      <div className="announcement">A little something lovely — complimentary shipping on orders over ₹3,500</div>
      <header className="site-header">
        <a className="wordmark" href="#home" aria-label="Lizona Boutique home">
          <span>LIZONA BOUTIQUE</span>
          <small>MADE TO FEEL LIKE YOU</small>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#shop">Shop all</a>
          <a href="#shop" onClick={() => setActiveCategory('Festive edit')}>Festive edit</a>
          <a href="#made-for-you">Made for you</a>
          <a href="#our-story">Our story</a>
        </nav>
        <div className="header-actions">
          {user ? (
            <button className="account-link" onClick={() => setActiveModal('account')} aria-label="Open your account">
              <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
              <span className="account-name">{user.name.split(' ')[0]}</span>
            </button>
          ) : (
            <button className="text-button" onClick={() => { setAuthMode('login'); setActiveModal('auth'); }}>Sign in</button>
          )}
          {user?.role === 'admin' && (
            <button className="admin-shortcut" onClick={() => setActiveModal('admin')}>Studio</button>
          )}
          <button className="bag-button" onClick={() => setActiveModal('cart')} aria-label={`Shopping bag, ${cartCount} items`}>
            <BagIcon />
            <span>Bag</span>
            <span className="bag-count">{cartCount}</span>
          </button>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <span className="eyebrow"><span className="eyebrow-line" /> A SLOWER KIND OF BEAUTIFUL</span>
            <h1>Clothes that<br />feel like <em>you.</em></h1>
            <p>Thoughtful pieces, made with love and a little bit of magic. For all the moments that make you, you.</p>
            <div className="hero-actions">
              <a className="button button-dark" href="#shop">Explore the collection <span>↗</span></a>
              <a className="underlined-link" href="#made-for-you">Discover custom tailoring</a>
            </div>
            <div className="hero-note">
              <div className="note-avatars"><span>A</span><span>M</span><span>S</span></div>
              <span>Loved by 2,000+ women across India</span>
            </div>
            <span className="hero-flower" aria-hidden="true">✳</span>
          </div>
          <div className="hero-image">
            <img src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1400&q=90" alt="Woman wearing a flowing traditional outfit in warm sunlight" />
            <div className="image-caption"><span>THE EVERYDAY HEIRLOOM</span><span>01 / 04</span></div>
            <div className="hero-sticker"><span>Made<br />with<br />intention</span><i>✳</i></div>
          </div>
        </section>

        <div className="trust-strip" aria-label="Our values">
          <span>✳ Thoughtfully made</span><i />
          <span>♧ Made to last</span><i />
          <span>♡ Made for you</span><i />
          <span>✳ A little less, a lot better</span>
        </div>

        <section className="collection-section" id="shop">
          <div className="section-heading">
            <div>
              <span className="eyebrow">THE GOOD THINGS</span>
              <h2>Pieces to keep <em>close.</em></h2>
            </div>
            <a className="underlined-link" href="#shop">A little bit of everything ↗</a>
          </div>
          <div className="collection-toolbar">
            <p>Thoughtful pieces for wherever the day takes you.</p>
            <div className="category-filters" aria-label="Filter products">
              {['All pieces', 'Ready to wear', 'Festive edit', 'Made for you'].map((category) => (
                <button
                  className={activeCategory === category ? 'filter-chip active' : 'filter-chip'}
                  key={category}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          <div className="product-grid">
            {visibleProducts.length ? visibleProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-image-wrap">
                  <img src={product.image} alt={product.name} loading="lazy" />
                  <span className="product-tag">{product.tag}</span>
                  <button className="quick-add" onClick={() => addToCart(product)} disabled={product.stock === 0}>
                    {product.stock ? 'Add to bag +' : 'Sold out'}
                  </button>
                </div>
                <div className="product-info">
                  <div><h3>{product.name}</h3><span>{product.category}</span></div>
                  <strong>{formatPrice(product.price)}</strong>
                </div>
              </article>
            )) : (
              <div className="empty-collection">A new little something is on its way. Check back soon.</div>
            )}
          </div>
        </section>

        <section className="tailoring-section" id="made-for-you">
          <div className="tailoring-image">
            <img src="https://images.unsplash.com/photo-1590736969955-71cc94901144?auto=format&fit=crop&w=1200&q=85" alt="Hands carefully measuring fabric for a custom garment" loading="lazy" />
            <span className="tailoring-image-note">A FIT THAT FEELS LIKE YOURS</span>
          </div>
          <div className="tailoring-copy">
            <span className="eyebrow">YOUR STORY, YOUR STITCH</span>
            <h2>Made for your<br /><em>kind of beautiful.</em></h2>
            <p>One size never told the whole story. Save your measurements once, and we’ll keep them close for every blouse, every celebration, every you.</p>
            <ul>
              <li><span>01</span> Share your measurements in minutes</li>
              <li><span>02</span> We stitch every detail just for you</li>
              <li><span>03</span> Your fit, saved for next time</li>
            </ul>
            <button className="button button-dark" onClick={() => {
              if (user) setActiveModal('measurements');
              else { setAuthMode('register'); setActiveModal('auth'); }
            }}>
              Save your measurements <span>↗</span>
            </button>
            <span className="tailoring-flower" aria-hidden="true">✳</span>
          </div>
        </section>

        <section className="quote-section" id="our-story">
          <span className="quote-mark">“</span>
          <p>We believe the best clothes aren’t just worn.<br />They become a part of your story.</p>
          <span className="eyebrow">A NOTE FROM OUR LITTLE STUDIO</span>
        </section>
      </main>

      <footer className="site-footer">
        <a className="wordmark footer-wordmark" href="#home"><span>LIZONA BOUTIQUE</span><small>MADE TO FEEL LIKE YOU</small></a>
        <span>Made slowly, with love in India.</span>
        <span>© 2026 Lizona Boutique</span>
      </footer>

      {notice && <div className="toast" role="status">{notice}</div>}
      {activeModal && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setActiveModal('');
        }}>
          {activeModal === 'cart' && (
            <aside className="side-panel" role="dialog" aria-modal="true" aria-labelledby="cart-title">
              <div className="panel-heading"><div><span className="eyebrow">GOOD THINGS, IN HERE</span><h2 id="cart-title">Your bag <span>({cartCount})</span></h2></div><button className="close-button" onClick={() => setActiveModal('')} aria-label="Close bag">×</button></div>
              {cart.length ? (
                <>
                  <div className="cart-items">
                    {cart.map((item) => (
                      <div className="cart-item" key={item.id}>
                        <img src={item.image} alt="" />
                        <div className="cart-item-detail"><h3>{item.name}</h3><span>{formatPrice(item.price)}</span><div className="quantity-control"><button onClick={() => updateQuantity(item.id, -1)} aria-label={`Remove one ${item.name}`}>−</button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} disabled={item.quantity >= item.stock} aria-label={`Add one ${item.name}`}>+</button></div></div>
                        <strong>{formatPrice(item.price * item.quantity)}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="cart-summary"><div><span>Subtotal</span><strong>{formatPrice(cartTotal)}</strong></div><p>Shipping and any applicable taxes are calculated at checkout.</p><button className="button button-dark full-button" onClick={() => {
                    if (!user) { setAuthMode('login'); setActiveModal('auth'); }
                    else setActiveModal('checkout');
                  }}>Continue to checkout <span>↗</span></button></div>
                </>
              ) : <div className="empty-state"><span>♡</span><h3>Your bag is taking a little nap.</h3><p>Come back when something feels like you.</p><button className="button button-dark" onClick={() => setActiveModal('')}>Find your favourites</button></div>}
            </aside>
          )}
          {activeModal === 'auth' && (
            <div className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="auth-title">
              <button className="close-button dialog-close" onClick={() => setActiveModal('')} aria-label="Close sign in">×</button>
              <span className="eyebrow">{authMode === 'register' ? 'COME ON IN' : 'WELCOME BACK'}</span><h2 id="auth-title">{authMode === 'register' ? <>A little space<br />that’s <em>just yours.</em></> : <>Lovely to see<br /><em>you again.</em></>}</h2>
              <p>Sign in or create an account to save your measurements and keep track of your orders.</p>
              <form className="form-stack" onSubmit={(event) => { event.preventDefault(); signIn(new FormData(event.currentTarget)); }}>
                {authMode === 'register' && <label>Your name <input name="name" placeholder="How should we call you?" autoComplete="name" required /></label>}
                <label>Email address <input name="email" type="email" placeholder="you@example.com" autoComplete="email" required /></label>
                {authMode === 'register' && <label>Mobile number <input name="phone" type="tel" placeholder="+91 98765 43210" autoComplete="tel" required /></label>}
                <button className="button button-dark full-button" type="submit">{authMode === 'register' ? 'Create your account' : 'Sign in'} <span>↗</span></button>
              </form>
              <button className="auth-switch" onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}>
                {authMode === 'register' ? 'Already have an account? Sign in' : 'New here? Create an account'}
              </button>
              <p className="demo-hint">Studio access? Sign in with <strong>admin@lizona-boutique.com</strong></p>
            </div>
          )}
          {activeModal === 'measurements' && (
            <div className="dialog-card wide-dialog" role="dialog" aria-modal="true" aria-labelledby="measure-title">
              <button className="close-button dialog-close" onClick={() => setActiveModal('')} aria-label="Close measurements">×</button>
              <span className="eyebrow">JUST BETWEEN US AND YOUR TAILOR</span><h2 id="measure-title">Your measurements.</h2>
              <p>Enter measurements in inches. We’ll save them safely for your next custom piece.</p>
              <form className="measurement-form" onSubmit={saveMeasurements}>
                {[
                  ['shoulder', 'Shoulder'], ['chest', 'Chest / bust'], ['waist', 'Waist'],
                  ['hip', 'Hip'], ['sleeve', 'Sleeve length'], ['length', 'Blouse length'],
                ].map(([field, label]) => (
                  <label key={field}>{label} <div className="input-unit"><input name={field} type="number" step="0.1" min="0" placeholder="—" defaultValue={measurements[field]} required /><span>in</span></div></label>
                ))}
                <button className="button button-dark full-button" type="submit">Save my measurements <span>↗</span></button>
              </form>
            </div>
          )}
          {activeModal === 'checkout' && (
            <div className="dialog-card wide-dialog" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
              <button className="close-button dialog-close" onClick={() => setActiveModal('')} aria-label="Close checkout">×</button>
              <span className="eyebrow">ALMOST YOURS</span><h2 id="checkout-title">A few little details.</h2>
              <form className="form-stack" onSubmit={completeCheckout}>
                <label>Delivery address <textarea name="address" placeholder="House / flat, street, city, PIN code" rows="3" required /></label>
                <label>Payment method <select name="payment"><option value="cod">Cash on delivery</option><option value="upi">UPI (demo)</option><option value="card">Credit / debit card (demo)</option></select></label>
                <div className="checkout-total"><span>Total to pay</span><strong>{formatPrice(cartTotal)}</strong></div>
                <button className="button button-dark full-button" type="submit">Place your order <span>↗</span></button>
              </form>
              <p className="demo-hint">Demo checkout only — no real payment will be collected.</p>
            </div>
          )}
          {activeModal === 'account' && user && (
            <div className="dialog-card account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-title">
              <button className="close-button dialog-close" onClick={() => setActiveModal('')} aria-label="Close account">×</button>
              <span className="eyebrow">{user.role === 'admin' ? 'YOUR STUDIO' : 'YOUR LITTLE CORNER'}</span><h2 id="account-title">Hello, {user.name.split(' ')[0]}.</h2>
              <p>{user.email}</p>
              <div className="account-options">
                {user.role === 'customer' && <button onClick={() => setActiveModal('measurements')}><span>↗</span><div><strong>Your measurements</strong><small>{Object.values(measurements).some(Boolean) ? 'Saved and ready for your next order' : 'Save your fit for next time'}</small></div></button>}
                {user.role === 'customer' && <div className="order-list"><h3>Your orders</h3>{orders.length ? orders.map((order) => {
                  const savedFit = Object.entries(order.measurements || {}).filter(([, value]) => value);
                  return <div className="order-row" key={order.id}><span>{order.id}<small>{order.date} · {order.items.length} piece(s)</small>{savedFit.length > 0 && <small>Measurements saved: {savedFit.map(([key, value]) => `${key} ${value}″`).join(' · ')}</small>}</span><strong>{formatPrice(order.total)}</strong></div>;
                }) : <p>Your story with us starts with your first order.</p>}</div>}
                {user.role === 'admin' && <button onClick={() => setActiveModal('admin')}><span>✳</span><div><strong>Manage your collection</strong><small>Add pieces and keep an eye on stock</small></div></button>}
                <button className="signout-button" onClick={() => { setUser(null); setActiveModal(''); setNotice('You have been signed out'); }}>Sign out <span>↗</span></button>
              </div>
            </div>
          )}
          {activeModal === 'admin' && user?.role === 'admin' && (
            <div className="dialog-card admin-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-title">
              <button className="close-button dialog-close" onClick={() => setActiveModal('')} aria-label="Close studio">×</button>
              <span className="eyebrow">THE LITTLE STUDIO</span><h2 id="admin-title">Your collection.</h2>
              <p>{products.length} pieces · {products.reduce((sum, product) => sum + product.stock, 0)} pieces in stock</p>
              <form className="admin-form" onSubmit={saveProduct}>
                <label>Piece name<input name="name" placeholder="e.g. The Mira Kurta" required /></label>
                <div className="form-row">
                  <label>Category<select name="category"><option>Ready to wear</option><option>Festive edit</option><option>Made for you</option></select></label>
                  <label>Price (₹)<input name="price" type="number" min="1" required /></label>
                  <label>Stock<input name="stock" type="number" min="0" required /></label>
                </div>
                <label>Photo URL <input name="image" type="url" placeholder="https://…" /></label>
                <button className="button button-dark full-button" type="submit">Add to collection <span>↗</span></button>
              </form>
              <div className="admin-stock-list">{products.map((product) => <form className="admin-product-form" key={product.id} onSubmit={(event) => updateProduct(event, product.id)}>
                <span>{product.name}<small>{product.category}</small></span>
                <label>Price<input name="price" type="number" min="1" defaultValue={product.price} required /></label>
                <label>Stock<input name="stock" type="number" min="0" defaultValue={product.stock} required /></label>
                <label className="admin-image-field">Photo URL<input name="image" type="url" defaultValue={product.image} /></label>
                <button type="submit">Save</button>
              </form>)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
