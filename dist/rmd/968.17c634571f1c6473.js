/*! svg.filter.js - v2.0.2 - 2016-02-24
      * https://github.com/wout/svg.filter.js
      * Copyright (c) 2016 Wout Fierens; Licensed MIT */
function(){SVG.Filter=SVG.invent({create:"filter",inherit:SVG.Parent,extend:{source:"SourceGraphic",sourceAlpha:"SourceAlpha",background:"BackgroundImage",backgroundAlpha:"BackgroundAlpha",fill:"FillPaint",stroke:"StrokePaint",autoSetIn:!0,put:function(x,M){return this.add(x,M),!x.attr("in")&&this.autoSetIn&&x.attr("in",this.source),x.attr("result")||x.attr("result",x),x},blend:function(x,M,I){return this.put(new SVG.BlendEffect(x,M,I))},colorMatrix:function(x,M){return this.put(new SVG.ColorMatrixEffect(x,M))},convolveMatrix:function(x){return this.put(new SVG.ConvolveMatrixEffect(x))},componentTransfer:function(x){return this.put(new SVG.ComponentTransferEffect(x))},composite:function(x,M,I){return this.put(new SVG.CompositeEffect(x,M,I))},flood:function(x,M){return this.put(new SVG.FloodEffect(x,M))},offset:function(x,M){return this.put(new SVG.OffsetEffect(x,M))},image:function(x){return this.put(new SVG.ImageEffect(x))},merge:function(){var x=[void 0];for(var M in arguments)x.push(arguments[M]);return this.put(new(SVG.MergeEffect.bind.apply(SVG.MergeEffect,x)))},gaussianBlur:function(x,M){return this.put(new SVG.GaussianBlurEffect(x,M))},morphology:function(x,M){return this.put(new SVG.MorphologyEffect(x,M))},diffuseLighting:function(x,M,I){return this.put(new SVG.DiffuseLightingEffect(x,M,I))},displacementMap:function(x,M,I,F,U){return this.put(new SVG.DisplacementMapEffect(x,M,I,F,U))},specularLighting:function(x,M,I,F){return this.put(new SVG.SpecularLightingEffect(x,M,I,F))},tile:function(){return this.put(new SVG.TileEffect)},turbulence:function(x,M,I,F,U){return this.put(new SVG.TurbulenceEffect(x,M,I,F,U))},toString:function(){return"url(#"+this.attr("id")+")"}}}),SVG.extend(SVG.Defs,{filter:function(x){var M=this.put(new SVG.Filter);return"function"==typeof x&&x.call(M,M),M}}),SVG.extend(SVG.Container,{filter:function(x){return this.defs().filter(x)}}),SVG.extend(SVG.Element,SVG.G,SVG.Nested,{filter:function(x){return this.filterer=x instanceof SVG.Element?x:this.doc().filter(x),this.doc()&&this.filterer.doc()!==this.doc()&&this.doc().defs().add(this.filterer),this.attr("filter",this.filterer),this.filterer},unfilter:function(x){return this.filterer&&!0===x&&this.filterer.remove(),delete this.filterer,this.attr("filter",null)}}),SVG.Effect=SVG.invent({create:function(){this.constructor.call(this)},inherit:SVG.Element,extend:{in:function(x){return null==x?this.parent()&&this.parent().select('[result="'+this.attr("in")+'"]').get(0)||this.attr("in"):this.attr("in",x)},result:function(x){return null==x?this.attr("result"):this.attr("result",x)},toString:function(){return this.result()}}}),SVG.ParentEffect=SVG.invent({create:function(){this.constructor.call(this)},inherit:SVG.Parent,extend:{in:function(x){return null==x?this.parent()&&this.parent().select('[result="'+this.attr("in")+'"]').get(0)||this.attr("in"):this.attr("in",x)},result:function(x){return null==x?this.attr("result"):this.attr("result",x)},toString:function(){return this.result()}}});var le={blend:function(x,M){return this.parent()&&this.parent().blend(this,x,M)},colorMatrix:function(x,M){return this.parent()&&this.parent().colorMatrix(x,M).in(this)},convolveMatrix:function(x){return this.parent()&&this.parent().convolveMatrix(x).in(this)},componentTransfer:function(x){return this.parent()&&this.parent().componentTransfer(x).in(this)},composite:function(x,M){return this.parent()&&this.parent().composite(this,x,M)},flood:function(x,M){return this.parent()&&this.parent().flood(x,M)},offset:function(x,M){return this.parent()&&this.parent().offset(x,M).in(this)},image:function(x){return this.parent()&&this.parent().image(x)},merge:function(){return this.parent()&&this.parent().merge.apply(this.parent(),[this].concat(arguments))},gaussianBlur:function(x,M){return this.parent()&&this.parent().gaussianBlur(x,M).in(this)},morphology:function(x,M){return this.parent()&&this.parent().morphology(x,M).in(this)},diffuseLighting:function(x,M,I){return this.parent()&&this.parent().diffuseLighting(x,M,I).in(this)},displacementMap:function(x,M,I,F){return this.parent()&&this.parent().displacementMap(this,x,M,I,F)},specularLighting:function(x,M,I,F){return this.parent()&&this.parent().specularLighting(x,M,I,F).in(this)},tile:function(){return this.parent()&&this.parent().tile().in(this)},turbulence:function(x,M,I,F,U){return this.parent()&&this.parent().turbulence(x,M,I,F,U).in(this)}};SVG.extend(SVG.Effect,le),SVG.extend(SVG.ParentEffect,le),SVG.ChildEffect=SVG.invent({create:function(){this.constructor.call(this)},inherit:SVG.Element,extend:{in:function(x){this.attr("in",x)}}});var o={blend:function(x,M,I){this.attr({in:x,in2:M,mode:I||"normal"})},colorMatrix:function(x,M){"matrix"==x&&(M=_(M)),this.attr({type:x,values:void 0===M?null:M})},convolveMatrix:function(x){x=_(x),this.attr({order:Math.sqrt(x.split(" ").length),kernelMatrix:x})},composite:function(x,M,I){this.attr({in:x,in2:M,operator:I})},flood:function(x,M){this.attr("flood-color",x),null!=M&&this.attr("flood-opacity",M)},offset:function(x,M){this.attr({dx:x,dy:M})},image:function(x){this.attr("href",x,SVG.xlink)},displacementMap:function(x,M,I,F,U){this.attr({in:x,in2:M,scale:I,xChannelSelector:F,yChannelSelector:U})},gaussianBlur:function(x,M){this.attr("stdDeviation",null!=x||null!=M?function(I){if(!Array.isArray(I))return I;for(var F=0,U=I.length,$=[];F<U;F++)$.push(I[F]);return $.join(" ")}(Array.prototype.slice.call(arguments)):"0 0")},morphology:function(x,M){this.attr({operator:x,radius:M})},tile:function(){},turbulence:function(x,M,I,F,U){this.attr({numOctaves:M,seed:I,stitchTiles:F,baseFrequency:x,type:U})}},c={merge:function(){var x;if(arguments[0]instanceof SVG.Set){var M=this;arguments[0].each(function(F){this instanceof SVG.MergeNode?M.put(this):(this instanceof SVG.Effect||this instanceof SVG.ParentEffect)&&M.put(new SVG.MergeNode(this))})}else{x=Array.isArray(arguments[0])?arguments[0]:arguments;for(var I=0;I<x.length;I++)x[I]instanceof SVG.MergeNode?this.put(x[I]):this.put(new SVG.MergeNode(x[I]))}},componentTransfer:function(x){if(this.rgb=new SVG.Set,["r","g","b","a"].forEach(function(I){this[I]=new(SVG["Func"+I.toUpperCase()])("identity"),this.rgb.add(this[I]),this.node.appendChild(this[I].node)}.bind(this)),x)for(var M in x.rgb&&(["r","g","b"].forEach(function(I){this[I].attr(x.rgb)}.bind(this)),delete x.rgb),x)this[M].attr(x[M])},diffuseLighting:function(x,M,I){this.attr({surfaceScale:x,diffuseConstant:M,kernelUnitLength:I})},specularLighting:function(x,M,I,F){this.attr({surfaceScale:x,diffuseConstant:M,specularExponent:I,kernelUnitLength:F})}},h={distantLight:function(x,M){this.attr({azimuth:x,elevation:M})},pointLight:function(x,M,I){this.attr({x,y:M,z:I})},spotLight:function(x,M,I,F,U,$){this.attr({x,y:M,z:I,pointsAtX:F,pointsAtY:U,pointsAtZ:$})},mergeNode:function(x){this.attr("in",x)}};function _(x){return Array.isArray(x)&&(x=new SVG.Array(x)),x.toString().replace(/^\s+/,"").replace(/\s+$/,"").replace(/\s+/g," ")}function b(){var x=function(){};for(var M in"function"==typeof arguments[arguments.length-1]&&(x=arguments[arguments.length-1],Array.prototype.splice.call(arguments,arguments.length-1,1)),arguments)for(var I in arguments[M])x(arguments[M][I],I,arguments[M])}["r","g","b","a"].forEach(function(x){h["Func"+x.toUpperCase()]=function(M){switch(this.attr("type",M),M){case"table":this.attr("tableValues",arguments[1]);break;case"linear":this.attr("slope",arguments[1]),this.attr("intercept",arguments[2]);break;case"gamma":this.attr("amplitude",arguments[1]),this.attr("exponent",arguments[2]),this.attr("offset",arguments[2])}}}),b(o,function(x,M){var I=M.charAt(0).toUpperCase()+M.slice(1);SVG[I+"Effect"]=SVG.invent({create:function(){this.constructor.call(this,SVG.create("fe"+I)),x.apply(this,arguments),this.result(this.attr("id")+"Out")},inherit:SVG.Effect,extend:{}})}),b(c,function(x,M){var I=M.charAt(0).toUpperCase()+M.slice(1);SVG[I+"Effect"]=SVG.invent({create:function(){this.constructor.call(this,SVG.create("fe"+I)),x.apply(this,arguments),this.result(this.attr("id")+"Out")},inherit:SVG.ParentEffect,extend:{}})}),b(h,function(x,M){var I=M.charAt(0).toUpperCase()+M.slice(1);SVG[I]=SVG.invent({create:function(){this.constructor.call(this,SVG.create("fe"+I)),x.apply(this,arguments)},inherit:SVG.ChildEffect,extend:{}})}),SVG.extend(SVG.MergeEffect,{in:function(x){return x instanceof SVG.MergeNode?this.add(x,0):this.add(new SVG.MergeNode(x),0),this}}),SVG.extend(SVG.CompositeEffect,SVG.BlendEffect,SVG.DisplacementMapEffect,{in2:function(x){return null==x?this.parent()&&this.parent().select('[result="'+this.attr("in2")+'"]').get(0)||this.attr("in2"):this.attr("in2",x)}}),SVG.filter={sepiatone:[.343,.669,.119,0,0,.249,.626,.13,0,0,.172,.334,.111,0,0,0,0,0,1,0]}}.call(void 0),function(){function le(b,x,M,I,F,U,$){for(var q=b.slice(x,M||$),ne=I.slice(F,U||$),de=0,ge={pos:[0,0],start:[0,0]},we={pos:[0,0],start:[0,0]};q[de]=o.call(ge,q[de]),ne[de]=o.call(we,ne[de]),q[de][0]!=ne[de][0]||"M"==q[de][0]||"A"==q[de][0]&&(q[de][4]!=ne[de][4]||q[de][5]!=ne[de][5])?(Array.prototype.splice.apply(q,[de,1].concat(h.call(ge,q[de]))),Array.prototype.splice.apply(ne,[de,1].concat(h.call(we,ne[de])))):(q[de]=c.call(ge,q[de]),ne[de]=c.call(we,ne[de])),++de!=q.length||de!=ne.length;)de==q.length&&q.push(["C",ge.pos[0],ge.pos[1],ge.pos[0],ge.pos[1],ge.pos[0],ge.pos[1]]),de==ne.length&&ne.push(["C",we.pos[0],we.pos[1],we.pos[0],we.pos[1],we.pos[0],we.pos[1]]);return{start:q,dest:ne}}function o(b){switch(b[0]){case"z":case"Z":b[0]="L",b[1]=this.start[0],b[2]=this.start[1];break;case"H":b[0]="L",b[2]=this.pos[1];break;case"V":b[0]="L",b[2]=b[1],b[1]=this.pos[0];break;case"T":b[0]="Q",b[3]=b[1],b[4]=b[2],b[1]=this.reflection[1],b[2]=this.reflection[0];break;case"S":b[0]="C",b[6]=b[4],b[5]=b[3],b[4]=b[2],b[3]=b[1],b[2]=this.reflection[1],b[1]=this.reflection[0]}return b}function c(b){var x=b.length;return this.pos=[b[x-2],b[x-1]],-1!="SCQT".indexOf(b[0])&&(this.reflection=[2*this.pos[0]-b[x-4],2*this.pos[1]-b[x-3]]),b}function h(b){var x=[b];switch(b[0]){case"M":return this.pos=this.start=[b[1],b[2]],x;case"L":b[5]=b[3]=b[1],b[6]=b[4]=b[2],b[1]=this.pos[0],b[2]=this.pos[1];break;case"Q":b[6]=b[4],b[5]=b[3],b[4]=1*b[4]/3+2*b[2]/3,b[3]=1*b[3]/3+2*b[1]/3,b[2]=1*this.pos[1]/3+2*b[2]/3,b[1]=1*this.pos[0]/3+2*b[1]/3;break;case"A":b=(x=function(M,I){var F,U,$,q,ne,de,ge,we,me,Se,N,Q,pe,xe,Le,Ze,kt,It,ii,wi,Mi,dn,En,Fn,Jn,ar,lr=Math.abs(I[1]),Lr=Math.abs(I[2]),Hr=I[3]%360,Wr=I[4],Mr=I[5],qn=I[6],as=I[7],$n=new SVG.Point(M),Xr=new SVG.Point(qn,as),ul=[];if(0===lr||0===Lr||$n.x===Xr.x&&$n.y===Xr.y)return[["C",$n.x,$n.y,Xr.x,Xr.y,Xr.x,Xr.y]];for((U=(F=new SVG.Point(($n.x-Xr.x)/2,($n.y-Xr.y)/2).transform((new SVG.Matrix).rotate(Hr))).x*F.x/(lr*lr)+F.y*F.y/(Lr*Lr))>1&&(lr*=U=Math.sqrt(U),Lr*=U),$=(new SVG.Matrix).rotate(Hr).scale(1/lr,1/Lr).rotate(-Hr),$n=$n.transform($),de=(q=[(Xr=Xr.transform($)).x-$n.x,Xr.y-$n.y])[0]*q[0]+q[1]*q[1],ne=Math.sqrt(de),q[0]/=ne,q[1]/=ne,ge=de<4?Math.sqrt(1-de/4):0,Wr===Mr&&(ge*=-1),we=new SVG.Point((Xr.x+$n.x)/2+ge*-q[1],(Xr.y+$n.y)/2+ge*q[0]),me=new SVG.Point($n.x-we.x,$n.y-we.y),Se=new SVG.Point(Xr.x-we.x,Xr.y-we.y),N=Math.acos(me.x/Math.sqrt(me.x*me.x+me.y*me.y)),me.y<0&&(N*=-1),Q=Math.acos(Se.x/Math.sqrt(Se.x*Se.x+Se.y*Se.y)),Se.y<0&&(Q*=-1),Mr&&N>Q&&(Q+=2*Math.PI),!Mr&&N<Q&&(Q-=2*Math.PI),Ze=[],kt=N,pe=(Q-N)/(xe=Math.ceil(2*Math.abs(N-Q)/Math.PI)),Le=4*Math.tan(pe/4)/3,Mi=0;Mi<=xe;Mi++)ii=Math.cos(kt),It=Math.sin(kt),wi=new SVG.Point(we.x+ii,we.y+It),Ze[Mi]=[new SVG.Point(wi.x+Le*It,wi.y-Le*ii),wi,new SVG.Point(wi.x-Le*It,wi.y+Le*ii)],kt+=pe;for(Ze[0][0]=Ze[0][1].clone(),Ze[Ze.length-1][2]=Ze[Ze.length-1][1].clone(),$=(new SVG.Matrix).rotate(Hr).scale(lr,Lr).rotate(-Hr),Mi=0,dn=Ze.length;Mi<dn;Mi++)Ze[Mi][0]=Ze[Mi][0].transform($),Ze[Mi][1]=Ze[Mi][1].transform($),Ze[Mi][2]=Ze[Mi][2].transform($);for(Mi=1,dn=Ze.length;Mi<dn;Mi++)En=(wi=Ze[Mi-1][2]).x,Fn=wi.y,Jn=(wi=Ze[Mi][0]).x,ar=wi.y,qn=(wi=Ze[Mi][1]).x,ul.push(["C",En,Fn,Jn,ar,qn,as=wi.y]);return ul}(this.pos,b))[0]}return b[0]="C",this.pos=[b[5],b[6]],this.reflection=[2*b[5]-b[3],2*b[6]-b[4]],x}function _(b,x){if(!1===x)return!1;for(var M=x,I=b.length;M<I;++M)if("M"==b[M][0])return M;return!1}SVG.extend(SVG.PathArray,{morph:function(b){for(var x=this.value,M=this.parse(b),I=0,F=0,U=!1,$=!1;!1!==I||!1!==F;){var q;U=_(x,!1!==I&&I+1),$=_(M,!1!==F&&F+1),!1===I&&(I=0==(q=new SVG.PathArray(ne.start).bbox()).height||0==q.width?x.push(x[0])-1:x.push(["M",q.x+q.width/2,q.y+q.height/2])-1),!1===F&&(F=0==(q=new SVG.PathArray(ne.dest).bbox()).height||0==q.width?M.push(M[0])-1:M.push(["M",q.x+q.width/2,q.y+q.height/2])-1);var ne=le(x,I,U,M,F,$);x=x.slice(0,I).concat(ne.start,!1===U?[]:x.slice(U)),M=M.slice(0,F).concat(ne.dest,!1===$?[]:M.slice($)),I=!1!==U&&I+ne.start.length,F=!1!==$&&F+ne.dest.length}return this.value=x,this.destination=new SVG.PathArray,this.destination.value=M,this}})}(),
/*! svg.draggable.js - v2.2.2 - 2019-01-08
      * https://github.com/svgdotjs/svg.draggable.js
      * Copyright (c) 2019 Wout Fierens; Licensed MIT */