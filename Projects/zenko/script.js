(function(){
  var PRICE=110;
  var EMAIL="dhruvkushwaha593@gmail.com"; /* used only for the email-app fallback link */
  var SCRIPT_URL="https://script.google.com/macros/s/AKfycbwY0biMdoO5jrXtlql5wK-B6AM-I3cqmDtYyp4WeLQrxeKyj0Tt9Wiz2ekt0NB5g4CPbA/exec
  ";
  var NAMES={volt:"Volt – Blueberry Lime",blaze:"Blaze – Mango Orange"};
  var $=function(id){return document.getElementById(id)};

  /* ---- Cart (saved in the browser so it works across pages) ---- */
  function load(){
    try{var c=JSON.parse(localStorage.getItem("zenko_cart"));
      if(c)return{volt:Math.max(0,+c.volt||0),blaze:Math.max(0,+c.blaze||0)}}catch(e){}
    return{volt:0,blaze:0};
  }
  var cart=load();
  function save(){try{localStorage.setItem("zenko_cart",JSON.stringify(cart))}catch(e){}}
  function count(){return cart.volt+cart.blaze}
  function badge(){if($("count"))$("count").textContent=count()}

  function toast(msg){
    var t=document.createElement("div");t.className="toast";t.textContent=msg;
    document.body.appendChild(t);setTimeout(function(){t.remove()},1800);
  }
  document.querySelectorAll("[data-add]").forEach(function(b){
    b.addEventListener("click",function(){
      var k=b.dataset.add;cart[k]++;save();badge();
      toast("Added "+NAMES[k]+" to cart");
    });
  });

  /* ---- Send to email through Google Apps Script (free) ---- */
  function send(data){
    if(SCRIPT_URL.indexOf("PASTE")===0)return Promise.resolve({ok:false,msg:"Google Script URL is not set in script.js."});
    return fetch(SCRIPT_URL,{
      method:"POST",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify(data)
    }).then(function(r){return r.json()}).then(function(j){
      if(j.success===true)return{ok:true};
      return{ok:false,msg:j.message||"Could not send."};
    }).catch(function(){return{ok:false,msg:"Could not reach the Google Script. Check the URL and your internet."}});
  }

  /* ---- Cart page ---- */
  if($("list")){
    var list=$("list"),form=$("orderForm");
    var render=function(){
      list.textContent="";badge();
      var n=count();
      $("total").textContent="₹"+(n*PRICE);
      $("totalRow").hidden=form.hidden=n===0;
      if(!n){
        var e=document.createElement("p");e.className="empty";
        e.append("Your cart is empty. ");
        var a=document.createElement("a");a.href="flavours.html";a.textContent="Browse flavours";
        e.appendChild(a);list.appendChild(e);return;
      }
      Object.keys(cart).forEach(function(k){
        if(!cart[k])return;
        var row=document.createElement("div");row.className="item";
        var info=document.createElement("div");info.textContent=NAMES[k];
        var s=document.createElement("small");s.textContent="₹"+PRICE+" per can";info.appendChild(s);
        var q=document.createElement("div");q.className="qty";
        var m=document.createElement("button");m.type="button";m.textContent="−";m.setAttribute("aria-label","Remove one "+k);
        var v=document.createElement("span");v.textContent=cart[k];
        var p=document.createElement("button");p.type="button";p.textContent="+";p.setAttribute("aria-label","Add one "+k);
        var x=document.createElement("button");x.type="button";x.className="rm";x.textContent="Remove";
        m.onclick=function(){cart[k]--;save();render()};
        p.onclick=function(){cart[k]++;save();render()};
        x.onclick=function(){cart[k]=0;save();render()};
        q.append(m,v,p,x);row.append(info,q);list.appendChild(row);
      });
    };
    render();

    form.addEventListener("submit",function(e){
      e.preventDefault();
      var name=$("name").value.trim(),phone=$("phone").value.trim(),
          email=$("email").value.trim(),addr=$("addr").value.trim(),err="";
      if(name.length<2)err="Enter your full name.";
      else if(!/^[6-9][0-9]{9}$/.test(phone))err="Enter a valid 10-digit mobile number.";
      else if(email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))err="Enter a valid email or leave it empty.";
      else if(addr.length<10)err="Enter your full delivery address.";
      $("err").textContent=err;
      if(err)return;

      var id="ZK"+String(Date.now()).slice(-6);
      var lines=[];
      Object.keys(cart).forEach(function(k){if(cart[k])lines.push(NAMES[k]+" x "+cart[k])});
      var total=count()*PRICE;
      var summary=lines.join(", ");
      var data={subject:"New Zenko order "+id,order_id:id,name:name,phone:phone,address:addr,items:summary,total:"Rs "+total};
      if(email){data.email=email;}

      var btn=$("placeBtn");btn.disabled=true;btn.textContent="Sending...";
      send(data).then(function(r){
        btn.disabled=false;btn.textContent="Place order";
        var d=$("done");d.textContent="";d.hidden=false;
        if(r.ok){
          d.textContent="Order "+id+" placed. Thank you, "+name+"! Total ₹"+total+". We have received your order by email. This is a sample page, so no payment was taken.";
          cart={volt:0,blaze:0};save();form.reset();$("err").textContent="";render();
          form.hidden=true;
        }else{
          d.append(r.msg+" ");
          var body="Order "+id+"\nName: "+name+"\nPhone: "+phone+"\nAddress: "+addr+"\nItems: "+summary+"\nTotal: Rs "+total;
          var a=document.createElement("a");
          a.href="mailto:"+EMAIL+"?subject="+encodeURIComponent("New Zenko order "+id)+"&body="+encodeURIComponent(body);
          a.textContent="Send this order from your email app instead.";
          d.appendChild(a);
        }
      });
    });
  }

  /* ---- Contact page ---- */
  if($("contactForm")){
    $("contactForm").addEventListener("submit",function(e){
      e.preventDefault();
      var n=$("cname").value.trim(),em=$("cemail").value.trim(),m=$("cmsg").value.trim(),err="";
      if(n.length<2)err="Enter your name.";
      else if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em))err="Enter a valid email.";
      else if(m.length<10)err="Message must be at least 10 characters.";
      $("cerr").textContent=err;
      if(err)return;
      var btn=$("sendBtn");btn.disabled=true;btn.textContent="Sending...";
      send({subject:"Zenko contact message",name:n,email:em,message:m}).then(function(r){
        btn.disabled=false;btn.textContent="Send message";
        if(r.ok){$("contactForm").hidden=true;$("cdone").hidden=false}
        else $("cerr").textContent=r.msg;
      });
    });
  }

  badge();
})();