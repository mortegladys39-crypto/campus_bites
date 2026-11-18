import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { collection, addDoc, getDocs, query, where, orderBy, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const $ = id => document.getElementById(id);
const money = n => '₱' + Number(n || 0).toFixed(2);
let currentUser = null, cart = [], products = [], isRegister = false, unsubscribeOrders = null;
const defaultProducts = [
  {id:'classic-burger',name:'Classic Burger',description:'Juicy burger with fresh lettuce and house sauce.',price:65,emoji:'🍔',category:'Meals'},
  {id:'cheese-fries',name:'Cheese Fries',description:'Crispy fries topped with creamy cheese.',price:45,emoji:'🍟',category:'Snacks'},
  {id:'pepperoni-pizza',name:'Pepperoni Pizza',description:'Cheesy pizza with savory pepperoni.',price:95,emoji:'🍕',category:'Meals'},
  {id:'iced-coffee',name:'Iced Coffee',description:'Chilled coffee for your study break.',price:55,emoji:'🧋',category:'Drinks'},
  {id:'chicken-sandwich',name:'Chicken Sandwich',description:'Crispy chicken in a soft toasted bun.',price:70,emoji:'🥪',category:'Meals'},
  {id:'donut',name:'Choco Donut',description:'Soft donut with chocolate topping.',price:30,emoji:'🍩',category:'Desserts'}
];
function toast(message){$('toast').textContent=message;$('toast').classList.remove('hidden');setTimeout(()=>$('toast').classList.add('hidden'),2600)}
function showModal(id){$(id).classList.remove('hidden')}
function hideModal(id){$(id).classList.add('hidden')}
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>hideModal(b.dataset.close)));
$('year').textContent=new Date().getFullYear();

async function loadProducts(){
  try { const snap=await getDocs(collection(db,'products')); products=snap.docs.map(d=>({id:d.id,...d.data()})); }
  catch(e){ console.error(e); products=[]; }
  if(!products.length) products=defaultProducts;
  renderMenu();
}
function renderMenu(){
  $('menu-grid').innerHTML=products.map(p=>`<article class="food-card"><div class="food-photo">${p.imageUrl?`<img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}">`:p.emoji||'🍽️'}</div><div class="food-info"><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description||'Freshly prepared for you.')}</p><div class="food-foot"><span class="price">${money(p.price)}</span><button class="add-btn" data-add="${escapeHtml(p.id)}">+ Add</button></div></div></article>`).join('');
  document.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>addToCart(b.dataset.add)));
}
function escapeHtml(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function addToCart(id){const p=products.find(x=>x.id===id);if(!p)return;const item=cart.find(x=>x.id===id);if(item)item.qty++;else cart.push({...p,qty:1});renderCart();toast(`${p.name} added to cart.`)}
function cartTotal(){return cart.reduce((sum,p)=>sum+Number(p.price)*p.qty,0)}
function renderCart(){ $('cart-count').textContent=cart.reduce((s,p)=>s+p.qty,0);$('cart-total').textContent=money(cartTotal());$('cart-items').innerHTML=cart.length?cart.map(p=>`<div class="cart-row"><div class="cart-emoji">${p.emoji||'🍽️'}</div><div class="cart-row-info"><b>${escapeHtml(p.name)}</b><small>${money(p.price)} each</small></div><div class="qty-controls"><button data-minus="${p.id}">−</button><b>${p.qty}</b><button data-plus="${p.id}">+</button></div></div>`).join(''):'<div class="empty-state">Your cart is empty. Add something delicious!</div>';
  document.querySelectorAll('[data-minus]').forEach(b=>b.addEventListener('click',()=>changeQty(b.dataset.minus,-1)));document.querySelectorAll('[data-plus]').forEach(b=>b.addEventListener('click',()=>changeQty(b.dataset.plus,1)));
}
function changeQty(id,delta){const p=cart.find(x=>x.id===id);if(!p)return;p.qty+=delta;if(p.qty<=0)cart=cart.filter(x=>x.id!==id);renderCart()}
$('cart-open').addEventListener('click',()=>$('cart-drawer').classList.remove('hidden'));
$('cart-close').addEventListener('click',()=>$('cart-drawer').classList.add('hidden'));
$('cart-drawer').addEventListener('click',e=>{if(e.target===$('cart-drawer'))$('cart-drawer').classList.add('hidden')});
$('checkout-btn').addEventListener('click',()=>{if(!cart.length){toast('Your cart is empty.');return}if(!currentUser){$('cart-drawer').classList.add('hidden');showModal('auth-modal');return}$('cart-drawer').classList.add('hidden');$('checkout-total').textContent=money(cartTotal());$('customer-name').value=currentUser.displayName||'';showModal('checkout-modal')});
$('payment-method').addEventListener('change',()=> $('gcash-wrap').classList.toggle('hidden',$('payment-method').value!=='GCash'));

$('auth-form').addEventListener('submit',async e=>{e.preventDefault();$('auth-message').textContent='';$('auth-submit').disabled=true;try{const email=$('auth-email').value.trim(),password=$('auth-password').value;if(isRegister){const name=$('auth-name').value.trim();if(!name)throw new Error('Please enter your full name.');const cred=await createUserWithEmailAndPassword(auth,email,password);await updateProfile(cred.user,{displayName:name});}else await signInWithEmailAndPassword(auth,email,password);hideModal('auth-modal');toast('You are signed in.');}catch(err){$('auth-message').textContent=authError(err)}finally{$('auth-submit').disabled=false}});
function authError(e){const map={'auth/email-already-in-use':'This email is already registered.','auth/invalid-email':'Please enter a valid email.','auth/weak-password':'Password must be at least 6 characters.','auth/invalid-credential':'Incorrect email or password.','auth/network-request-failed':'Network error. Check your connection.'};return map[e.code]||e.message||'Something went wrong.'}
$('switch-auth').addEventListener('click',()=>{isRegister=!isRegister;$('auth-title').textContent=isRegister?'Create Customer Account':'Customer Login';$('auth-subtitle').textContent=isRegister?'Register to order from Campus Bites.':'Sign in to place an order and track it.';$('name-wrap').classList.toggle('hidden',!isRegister);$('auth-submit').textContent=isRegister?'Create Account':'Sign In';$('switch-text').textContent=isRegister?'Already have an account?':'New to Campus Bites?';$('switch-auth').textContent=isRegister?'Sign in':'Create account';$('auth-message').textContent='';$('auth-password').autocomplete=isRegister?'new-password':'current-password'});

$('checkout-form').addEventListener('submit',async e=>{e.preventDefault();if(!currentUser){$('checkout-message').textContent='Please sign in first.';return}if(!cart.length)return;const btn=e.submitter;btn.disabled=true;$('checkout-message').textContent='Placing your order…';try{const items=cart.map(p=>({productId:p.id,name:p.name,price:Number(p.price),quantity:p.qty}));const total=cartTotal();await addDoc(collection(db,'orders'),{uid:currentUser.uid,customerName:$('customer-name').value.trim(),phone:$('customer-phone').value.trim(),location:$('customer-location').value.trim(),paymentMethod:$('payment-method').value,gcashReference:$('gcash-reference').value.trim(),items,total,status:'Pending',createdAt:serverTimestamp()});cart=[];renderCart();hideModal('checkout-modal');$('checkout-message').textContent='';toast('Order placed successfully!');}catch(err){console.error(err);$('checkout-message').textContent='Could not place order. Please try again.'}finally{btn.disabled=false}});

function watchOrders(user){if(unsubscribeOrders)unsubscribeOrders();const q=query(collection(db,'orders'),where('uid','==',user.uid));unsubscribeOrders=onSnapshot(q,snap=>{const orders=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));$('orders-list').innerHTML=orders.length?orders.map(o=>`<article class="order-card"><div><h3>Order #${o.id.slice(-6).toUpperCase()} · ${money(o.total)}</h3><p>${(o.items||[]).map(i=>`${escapeHtml(i.name)} × ${i.quantity}`).join(', ')}<br>${o.paymentMethod||''} · ${o.location||''}</p></div><span class="status ${String(o.status||'').toLowerCase()}">${escapeHtml(o.status||'Pending')}</span></article>`).join(''):'<div class="empty-state">You have no orders yet.</div>'},err=>{console.error(err);$('orders-list').innerHTML='<div class="empty-state">Unable to load orders right now.</div>'})}
onAuthStateChanged(auth,user=>{currentUser=user;if(user){$('cart-open').textContent='Account · Sign Out';$('cart-open').onclick=async()=>{if(confirm('Sign out of Campus Bites?'))await signOut(auth)};watchOrders(user)}else{$('cart-open').innerHTML='Cart <span id="cart-count">'+cart.reduce((s,p)=>s+p.qty,0)+'</span>';$('cart-open').onclick=()=>$('cart-drawer').classList.remove('hidden');if(unsubscribeOrders)unsubscribeOrders();$('orders-list').innerHTML='<div class="empty-state">Please sign in to view your orders.</div>'}});
loadProducts();renderCart();
