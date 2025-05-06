/* public/widgets/build_card_widget.css */

.build-card {
  background: rgba(15,25,39,0.7);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0,0,0,0.2);
}
.card-header .hero-avatar {
  width: 40px; height: 40px;
  border-radius: 4px;
  object-fit: cover;
}
.card-header .hero-name {
  margin: 0; font-size: 1.1rem; flex:1;
}
.card-header .btn-view {
  color: #8ab4f8; text-decoration: none; font-weight:500;
}
.card-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  flex:1;
}
.squares {
  display: flex; gap: 8px; margin-bottom: 16px;
}
.square {
  flex:1; height:60px;
  background: rgba(0,0,0,0.2);
  border-radius:4px;
  display:flex; align-items:center; justify-content:center;
}
.square .icon {
  max-width:100%; max-height:100%;
}
.circles {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap:12px; margin-bottom:16px;
  justify-items: center;
}
.circle {
  width:48px; height:48px;
  background: rgba(0,0,0,0.2);
  border-radius:50%;
  display:flex; align-items:center; justify-content:center;
}
.circle .icon {
  max-width:70%; max-height:70%;
}
.cost {
  margin-top:auto; text-align:right;
  font-weight:bold; font-size:1rem; color:#ddd;
}
