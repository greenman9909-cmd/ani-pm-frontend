import{j as n,a as Wt}from"./query-V7WhSRdC.js";import{r as f,c as Yt}from"./react-DeiVZVzB.js";import{A as Kt}from"./AnimeCard-7vp7TjMF.js";import{I as St,J as Ye,h as Vt,K as Qt,d as Zt,L as Jt,N as $t,O as Rt,P as er,Q as tr,R as rr}from"./index-DQbZxriH.js";import{u as nr}from"./useMediaQuery-Cfz7WKjp.js";import{u as or}from"./useTitle-C0Yb-JXh.js";import{s as ar,m as ir}from"./search-D9AjZRh4.js";import"./useImageFallback-C-2ezrdy.js";import"./poster-frame-DWUXijz8.js";import"./LibraryButton-DT4ZKuEn.js";import"./WatchStatusMenu-jgSsQc44.js";import"./motion-ibPDHKAQ.js";const sr=`
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`,lr=`
precision highp float;

#define MAX_STEPS 460

#define WIND_CYCLE 46.0

varying vec2 vUv;

uniform vec2  uRes;
uniform float uTime;
uniform vec3  uCamPos;
uniform vec3  uRight;
uniform vec3  uUp;
uniform vec3  uFwd;
uniform float uTanHalf;
uniform vec2  uFocus;
uniform float uSteps;
uniform float uSkyR;
uniform float uDiskIn;
uniform float uDiskOut;
uniform float uThick;
uniform float uDensity;
uniform float uSpin;
uniform float uGrain;
uniform float uBright;
uniform float uDoppler;
uniform vec3  uHot;
uniform vec3  uMid;
uniform vec3  uCool;
uniform float uStars;
uniform float uEncode;
uniform vec2  uJitter;
uniform float uSeed;

float hash13(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}

float fbm(vec3 p, float lod) {
  float a = 0.5;
  float s = 0.0;
  for (int i = 0; i < 4; i++) {
    s += (i == 3 ? a * lod : a) * vnoise(p);
    p = p * 2.03 + vec3(11.3, 7.1, 3.7);
    a *= 0.5;
  }
  return s;
}

void gasAt(vec3 p, float rd, float dt, out float dens, out vec3 tint, out float heat) {
  float rn = clamp((rd - uDiskIn) / max(0.001, uDiskOut - uDiskIn), 0.0, 1.0);

  float tk = uThick * (0.35 + 1.25 * rn);
  float v = p.y / tk;
  float sheet = exp(-v * v);

  float lod = clamp(1.0 - dt * uGrain * 14.0, 0.0, 1.0);

  float phi = atan(p.z, p.x);

  float omega = uSpin * pow(uDiskIn / rd, 1.5);

  float lr = log(rd) * 1.1 + uSpin * uTime * 0.05;

  float u = uTime / WIND_CYCLE;
  float fA = fract(u);
  float fB = fract(u + 0.5);
  float w = abs(2.0 * fA - 1.0);

  float cloudsA = fbm(vec3(vec2(cos(phi + omega * fA * WIND_CYCLE),
                                sin(phi + omega * fA * WIND_CYCLE)) * (rd * uGrain), lr), lod);
  float cloudsB = fbm(vec3(vec2(cos(phi + omega * fB * WIND_CYCLE),
                                sin(phi + omega * fB * WIND_CYCLE)) * (rd * uGrain), lr + 40.0), lod);
  float clouds = mix(cloudsA, cloudsB, w);

  float filaments = clouds * clouds * 1.75;

  float inner = smoothstep(0.0, 0.07, rn);
  float outer = 1.0 - smoothstep(0.45, 1.0, rn);
  float prof = inner * outer * pow(uDiskIn / rd, 2.0);

  dens = max(0.0, filaments * 1.5 - 0.30) * sheet * prof * uDensity * 4.6;

  heat = pow(uDiskIn / rd, 0.8) * (0.72 + 0.55 * clouds);
  tint = mix(uCool, uMid, smoothstep(0.10, 0.52, heat));
  tint = mix(tint, uHot, smoothstep(0.52, 1.05, heat));
}

vec3 starField(vec3 d) {
  vec3 a = abs(d);
  vec2 uv;
  float face;
  if (a.x >= a.y && a.x >= a.z)      { uv = d.yz / a.x; face = d.x > 0.0 ? 0.0 : 1.0; }
  else if (a.y >= a.z)               { uv = d.xz / a.y; face = d.y > 0.0 ? 2.0 : 3.0; }
  else                               { uv = d.xy / a.z; face = d.z > 0.0 ? 4.0 : 5.0; }

  vec3 col = vec3(0.0);
  for (int k = 0; k < 3; k++) {
    float sc = 90.0 * pow(2.2, float(k));
    vec2 p = uv * sc;
    vec2 id = floor(p);
    vec2 f = fract(p) - 0.5;
    float h = hash13(vec3(id, face * 19.0));
    if (h > 0.965) {
      vec2 off = vec2(hash13(vec3(id, face + 11.0)), hash13(vec3(id, face + 23.0)));
      float dd = length(f - (off - 0.5) * 0.7);
      float s = smoothstep(0.055, 0.0, dd);
      float warm = hash13(vec3(id, face + 51.0));
      col += s * (0.6 + 4.5 * fract(h * 97.0))
           * mix(vec3(0.72, 0.82, 1.0), vec3(1.0, 0.88, 0.72), warm)
           / pow(2.2, float(k));
    }
  }

  col += vec3(0.013, 0.017, 0.030) * fbm(d * 2.6, 1.0);
  return col;
}

void main() {

  vec2 uv = (gl_FragCoord.xy + uJitter - uFocus * uRes) / uRes.y;
  vec3 dir = normalize(uFwd + (uv.x * uRight + uv.y * uUp) * 2.0 * uTanHalf);

  vec3 pos = uCamPos;
  vec3 vel = dir;

  vec3 hv = cross(pos, vel);
  float h2 = dot(hv, hv);
  float h = sqrt(h2);

  float swept = 0.0;

  vec3 col = vec3(0.0);
  float transmit = 1.0;
  bool captured = false;

  float jitter = fract(sin(dot(gl_FragCoord.xy + uSeed, vec2(12.9898, 78.233))) * 43758.5453);

  for (int i = 0; i < MAX_STEPS; i++) {
    if (float(i) >= uSteps) break;

    float r2 = dot(pos, pos);
    float r = sqrt(r2);

    if (r < 1.0) { captured = true; break; }          // through the horizon
    if (r > uSkyR && dot(pos, vel) > 0.0) break;      // gone, and not coming back
    if (transmit < 0.004) break;                      // nothing behind this is visible

    float dt = clamp(0.14 * (r - 1.0), 0.025, 1.1);

    if (r < uDiskOut * 1.25) {
      float rn = clamp((r - uDiskIn) / max(0.001, uDiskOut - uDiskIn), 0.0, 1.0);
      float tk = uThick * (0.35 + 1.25 * rn);
      dt = min(dt, max(tk * 0.38, abs(pos.y) * 0.5));
    }

    swept += h * dt / r2;

    float deep = exp(-1.3 * max(0.0, swept - 4.6));

    jitter = fract(jitter + 0.6180339887);
    vec3 mid = pos + vel * (dt * jitter);
    float rd = length(mid.xz);

    if (rd > uDiskIn && rd < uDiskOut && abs(mid.y) < uThick * 5.0) {
      float dens;
      float heat;
      vec3 tint;
      gasAt(mid, rd, dt, dens, tint, heat);

      if (dens > 0.001) {

        vec3 tang = normalize(cross(vec3(0.0, 1.0, 0.0), vec3(mid.x, 0.0, mid.z)));
        float beta = min(0.85, sqrt(0.5 / max(rd, 1.5)));
        float gam = inversesqrt(max(1e-4, 1.0 - beta * beta));
        vec3 toObs = -normalize(vel);
        float g = 1.0 / (gam * (1.0 - beta * dot(tang, toObs)));
        g *= sqrt(max(0.05, 1.0 - 1.0 / rd));
        float boost = pow(max(g, 0.02), 3.0 * uDoppler);

        vec3 shift = mix(
          vec3(1.0),
          g > 1.0 ? vec3(0.86, 0.94, 1.14) : vec3(1.15, 0.82, 0.62),
          clamp(abs(g - 1.0) * 1.6, 0.0, 1.0) * uDoppler
        );

        float emit = uBright * (0.26 + 2.0 * heat * heat);
        col += tint * shift * (emit * boost * dens * transmit * dt * deep);
        transmit *= exp(-dens * 0.30 * dt);
      }
    }

    vec3 acc = -1.5 * h2 * pos / (r2 * r2 * r);
    vel += acc * dt;
    pos += vel * dt;
  }

  if (!captured && uStars > 0.001) {

    vec3 toHole = normalize(-uCamPos);
    float sI = length(cross(normalize(dir), toHole));
    float sS = length(cross(normalize(vel), toHole));
    float stretch = clamp(sI / max(1e-3, sS), 1.0, 40.0);
    col += starField(normalize(vel)) * uStars * transmit / stretch;
  }

  if (uEncode > 0.5) col = col / (1.0 + col);
  gl_FragColor = vec4(col, 1.0);
}
`,cr=`
precision highp float;
varying vec2 vUv;
uniform sampler2D uCur;
uniform sampler2D uPrev;
uniform float uAlpha;

void main() {
  vec3 c = texture2D(uCur, vUv).rgb;
  vec3 p = texture2D(uPrev, vUv).rgb;
  gl_FragColor = vec4(mix(p, c, uAlpha), 1.0);
}
`,ur=`
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uTexel;
uniform float uDecode;
uniform float uPack;
uniform float uThreshold;

void main() {
  vec3 s = texture2D(uTex, vUv + uTexel * vec2(-1.0, -1.0)).rgb
         + texture2D(uTex, vUv + uTexel * vec2( 1.0, -1.0)).rgb
         + texture2D(uTex, vUv + uTexel * vec2(-1.0,  1.0)).rgb
         + texture2D(uTex, vUv + uTexel * vec2( 1.0,  1.0)).rgb;
  s *= 0.25;
  if (uDecode > 0.5) s = s / max(vec3(0.002), 1.0 - s);
  float l = max(s.r, max(s.g, s.b));
  s *= max(0.0, l - uThreshold) / max(0.0001, l);
  gl_FragColor = vec4(s * uPack, 1.0);
}
`,fr=`
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uStep;

void main() {
  vec3 s = texture2D(uTex, vUv).rgb * 0.2270270;
  s += (texture2D(uTex, vUv + uStep * 1.3846154).rgb
      + texture2D(uTex, vUv - uStep * 1.3846154).rgb) * 0.3162162;
  s += (texture2D(uTex, vUv + uStep * 3.2307692).rgb
      + texture2D(uTex, vUv - uStep * 3.2307692).rgb) * 0.0702702;
  gl_FragColor = vec4(s, 1.0);
}
`,mr=`
precision highp float;
varying vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform vec2  uRes;
uniform float uDecode;
uniform float uPack;
uniform float uGlow;
uniform float uExposure;
uniform float uVignette;
uniform float uScrimDir;
uniform float uScrimAmt;
uniform float uSeed;

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec3 scene = texture2D(uScene, vUv).rgb;
  if (uDecode > 0.5) scene = scene / max(vec3(0.002), 1.0 - scene);
  vec3 bloom = texture2D(uBloom, vUv).rgb / uPack;

  vec3 c = scene + bloom * uGlow;
  c = aces(c * uExposure);
  c = pow(max(c, 0.0), vec3(0.4545));

  vec2 d = vUv - 0.5;
  c *= 1.0 - uVignette * dot(d, d) * 1.9;

  if (uScrimDir > 0.5) {
    float x = uScrimDir < 1.5 ? vUv.x
            : uScrimDir < 2.5 ? 1.0 - vUv.x
            : uScrimDir < 3.5 ? 1.0 - vUv.y
            : vUv.y;
    c *= 1.0 - uScrimAmt * pow(1.0 - clamp(x, 0.0, 1.0), 2.4);
  }

  float n = fract(sin(dot(gl_FragCoord.xy + uSeed, vec2(12.9898, 78.233))) * 43758.5453);
  c += (n - 0.5) / 255.0;

  gl_FragColor = vec4(c, 1.0);
}
`,Se=Math.PI/180;function Ke(i){const h=i.trim().replace("#",""),p=h.length===3?h[0]+h[0]+h[1]+h[1]+h[2]+h[2]:h.slice(0,6),E=parseInt(p,16);return[(E>>16&255)/255,(E>>8&255)/255,(E&255)/255].map(m=>m<=.04045?m/12.92:Math.pow((m+.055)/1.055,2.4))}function dr({motionEnabled:i=!0,distance:h=24,elevation:p=-5.5,azimuth:E=0,orbitSpeed:A=0,roll:m=-20,fov:y=42,diskInner:j=3,diskOuter:re=15,diskThickness:X=.26,diskDensity:I=1,brightness:b=1,spinSpeed:c=.06,grain:v=.48,doppler:q=.35,hotColor:W="#FFF3DE",midColor:g="#FF9838",coolColor:D="#8E3A0B",starBrightness:T=0,glow:U=1,exposure:S=.9,vignette:w=.28,steps:C=300,resolution:Y=.7,maxDpr:K=1.75,focus:Re=[.72,.46],scrim:de="none",scrimStrength:Me=.9,paused:Ae=!1,className:o="",children:u,...Dt}){const Ve=f.useRef(null),Qe=f.useRef(null),V=f.useRef({distance:h,elevation:p,azimuth:E,orbitSpeed:A,roll:m,fov:y,diskInner:j,diskOuter:re,diskThickness:X,diskDensity:I,brightness:b,spinSpeed:c,grain:v,doppler:q,hotColor:W,midColor:g,coolColor:D,starBrightness:T,glow:U,exposure:S,vignette:w,steps:C,resolution:Y,maxDpr:K,focus:Re,scrim:de,scrimStrength:Me,paused:Ae,motionEnabled:i});return V.current={distance:h,elevation:p,azimuth:E,orbitSpeed:A,roll:m,fov:y,diskInner:j,diskOuter:re,diskThickness:X,diskDensity:I,brightness:b,spinSpeed:c,grain:v,doppler:q,hotColor:W,midColor:g,coolColor:D,starBrightness:T,glow:U,exposure:S,vignette:w,steps:C,resolution:Y,maxDpr:K,focus:Re,scrim:de,scrimStrength:Me,paused:Ae,motionEnabled:i},f.useEffect(()=>{const ne=Ve.current,_=Qe.current;if(!ne||!_)return;const oe=!i||typeof window.matchMedia=="function"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches,Ze={alpha:!1,antialias:!1,depth:!1,stencil:!1,powerPreference:"high-performance",preserveDrawingBuffer:!1},e=_.getContext("webgl2",Ze)||_.getContext("webgl",Ze);function he(r){ne.dataset.webgl=r,_.style.display="none"}if(!e){he("unsupported");return}const Je=e.getExtension("WEBGL_debug_renderer_info"),yt=Je?String(e.getParameter(Je.UNMASKED_RENDERER_WEBGL)||""):"",De=/swiftshader|llvmpipe|softpipe|software|microsoft basic/i.test(yt),$e=typeof WebGL2RenderingContext<"u"&&e instanceof WebGL2RenderingContext;let ye=e.getExtension("KHR_parallel_shader_compile");function et(r,t){const a=e.createShader(r);return a?(e.shaderSource(a,t),e.compileShader(a),ye||e.getShaderParameter(a,e.COMPILE_STATUS)?a:(console.error("blackhole: shader failed —",e.getShaderInfoLog(a)||"no log (context lost?)"),e.deleteShader(a),null)):null}function wt(r){const t=et(e.VERTEX_SHADER,sr),a=et(e.FRAGMENT_SHADER,r);if(!t||!a)return null;const s=e.createProgram();return s?(e.attachShader(s,t),e.attachShader(s,a),e.bindAttribLocation(s,0,"aPos"),e.linkProgram(s),e.deleteShader(t),e.deleteShader(a),s):null}function Ft(r){if(!e.getProgramParameter(r,e.LINK_STATUS)){for(const s of e.getAttachedShaders(r)||[])e.getShaderParameter(s,e.COMPILE_STATUS)||console.error("blackhole: shader failed —",e.getShaderInfoLog(s)||"no log");return console.error(e.getProgramInfoLog(r)),null}const t={},a=e.getProgramParameter(r,e.ACTIVE_UNIFORMS);for(let s=0;s<a;s++){const d=e.getActiveUniform(r,s);d&&(t[d.name]=e.getUniformLocation(r,d.name))}return{program:r,u:t}}function kt(r){return ye?!!e.getProgramParameter(r,ye.COMPLETION_STATUS_KHR):!0}const Pt=120;function tt(r){return r>Pt?!0:be.every(t=>t&&kt(t))}let B=!0,we=e.UNSIGNED_BYTE,Le=e.RGBA;if($e){const r=e;r.getExtension("EXT_color_buffer_half_float")||r.getExtension("EXT_color_buffer_float")?(we=r.HALF_FLOAT,Le=r.RGBA16F):B=!1}else{const r=e.getExtension("OES_texture_half_float"),t=e.getExtension("EXT_color_buffer_half_float");r&&t?we=r.HALF_FLOAT_OES:B=!1}B||(we=e.UNSIGNED_BYTE,Le=e.RGBA);const rt=$e||!!e.getExtension("OES_texture_half_float_linear")||!B?e.LINEAR:e.NEAREST,nt=B?1:.12;function pe(r,t){const a=e.createTexture(),s=e.createFramebuffer();if(!a||!s)return null;e.bindTexture(e.TEXTURE_2D,a),e.texImage2D(e.TEXTURE_2D,0,Le,r,t,0,e.RGBA,we,null),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,rt),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,rt),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.bindFramebuffer(e.FRAMEBUFFER,s),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,a,0);const d=e.checkFramebufferStatus(e.FRAMEBUFFER);return e.bindFramebuffer(e.FRAMEBUFFER,null),d!==e.FRAMEBUFFER_COMPLETE?(e.deleteTexture(a),e.deleteFramebuffer(s),null):{fb:s,tex:a,w:r,h:t}}let ae=null,O=null,F=null,Q=null,x=null,Fe=null,z=null,Z=null,G=null,k=null,H=null,ve=0,xe=0,ge=0,Ne=0,je=0,be=[];function ot(){return be=[lr,cr,ur,fr,mr].map(wt),be.some(r=>!r)?!1:(Fe=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,Fe),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.disable(e.DEPTH_TEST),e.disable(e.BLEND),!0)}function at(){const[r,t,a,s,d]=be.map(P=>P?Ft(P):null);return ae=r,O=t,F=a,Q=s,x=d,!!(r&&t&&a&&s&&d)}function it(){for(const r of[z,Z,G,k,H])r&&(e.deleteTexture(r.tex),e.deleteFramebuffer(r.fb));z=null,Z=null,G=null,k=null,H=null,ve=0}function Ie(){const r=ne.getBoundingClientRect(),t=De?1:Math.min(window.devicePixelRatio||1,Math.max(1,V.current.maxDpr)),a=Math.max(1,Math.round(r.width)),s=Math.max(1,Math.round(r.height)),d=De?.34:Math.min(1,Math.max(.4,V.current.resolution)),P=Math.max(2,Math.round(a*t)),$=Math.max(2,Math.round(s*t));let R=Math.max(2,Math.round(P*d)),M=Math.max(2,Math.round($*d));const ee=De?18e4:85e4,ce=R*M;if(ce>ee){const N=Math.sqrt(ee/ce);R=Math.max(2,Math.round(R*N)),M=Math.max(2,Math.round(M*N))}if(P===xe&&$===ge&&R===Ne&&M===je)return;xe=P,ge=$,Ne=R,je=M,_.width=P,_.height=$,_.style.width=a+"px",_.style.height=s+"px",it(),z=pe(R,M),Z=pe(R,M),G=pe(R,M);const te=Math.max(2,R>>2),L=Math.max(2,M>>2);k=pe(te,L),H=pe(te,L)}let Be=oe?6:0,ie=0,ke=!0,Oe=!0,J=0,st=0;function lt(){return ke&&Oe&&!document.hidden&&!V.current.paused&&V.current.motionEnabled}function _e(){oe||J||!lt()||(J=requestAnimationFrame(ft))}function Pe(){J&&cancelAnimationFrame(J),J=0,ie=0}function Ee(r,t){e.useProgram(r.program),e.bindFramebuffer(e.FRAMEBUFFER,t?t.fb:null),e.viewport(0,0,t?t.w:xe,t?t.h:ge)}function Te(){e.drawArrays(e.TRIANGLES,0,3)}function se(r,t){e.activeTexture(e.TEXTURE0+t),e.bindTexture(e.TEXTURE_2D,r)}const ct=[[.5,.333],[.25,.667],[.75,.111],[.125,.444],[.625,.778],[.375,.222],[.875,.556],[.0625,.889]];function ut(r){if(!ae||!O||!F||!Q||!x||!z||!Z||!G||!k||!H)return;const t=V.current,a=(t.azimuth+t.orbitSpeed*r)*Se,s=Math.max(-88,Math.min(88,t.elevation))*Se,d=Math.max(2.2,t.distance),P=Math.cos(s),$=d*P*Math.cos(a),R=d*Math.sin(s),M=d*P*Math.sin(a),ee=-$/d,ce=-R/d,te=-M/d;let L=te,N=0,ue=-ee;const Ge=Math.hypot(L,N,ue)||1;L/=Ge,N/=Ge,ue/=Ge;let gt=N*te-ue*ce,bt=ue*ee-L*te,_t=L*ce-N*ee;const fe=Math.cos(t.roll*Se),me=Math.sin(t.roll*Se),Lt=L*fe+gt*me,Nt=N*fe+bt*me,jt=ue*fe+_t*me,It=-L*me+gt*fe,Bt=-N*me+bt*fe,Ot=-ue*me+_t*fe,He=Ke(t.hotColor),Xe=Ke(t.midColor),qe=Ke(t.coolColor),Et=Math.max(t.diskInner+.5,t.diskOuter);Ee(ae,z);const l=ae.u;e.uniform2f(l.uRes,z.w,z.h),e.uniform1f(l.uTime,r),e.uniform3f(l.uCamPos,$,R,M),e.uniform3f(l.uRight,Lt,Nt,jt),e.uniform3f(l.uUp,It,Bt,Ot),e.uniform3f(l.uFwd,ee,ce,te),e.uniform1f(l.uTanHalf,Math.tan(Math.max(8,Math.min(110,t.fov))*.5*Se)),e.uniform2f(l.uFocus,t.focus[0],1-t.focus[1]),e.uniform1f(l.uSteps,De?130:Math.max(60,Math.min(460,Math.round(t.steps)))),e.uniform1f(l.uSkyR,Math.max(d*1.35,Et*2.4)),e.uniform1f(l.uDiskIn,Math.max(1.05,t.diskInner)),e.uniform1f(l.uDiskOut,Et),e.uniform1f(l.uThick,Math.max(.02,t.diskThickness)),e.uniform1f(l.uDensity,Math.max(0,t.diskDensity)),e.uniform1f(l.uSpin,t.spinSpeed*6.2831853),e.uniform1f(l.uGrain,Math.max(.02,t.grain)),e.uniform1f(l.uBright,Math.max(0,t.brightness)),e.uniform1f(l.uDoppler,Math.max(0,Math.min(1,t.doppler))),e.uniform3f(l.uHot,He[0],He[1],He[2]),e.uniform3f(l.uMid,Xe[0],Xe[1],Xe[2]),e.uniform3f(l.uCool,qe[0],qe[1],qe[2]),e.uniform1f(l.uStars,Math.max(0,t.starBrightness)),e.uniform1f(l.uEncode,B?0:1);const Tt=ct[ve%ct.length];e.uniform2f(l.uJitter,Tt[0]-.5,Tt[1]-.5),e.uniform1f(l.uSeed,ve%64*17.13),Te();const zt=ve===0?1:.14;Ee(O,G),se(z.tex,0),se(Z.tex,1),e.uniform1i(O.u.uCur,0),e.uniform1i(O.u.uPrev,1),e.uniform1f(O.u.uAlpha,zt),Te();const Ue=G,Gt=Z;Z=G,G=Gt,ve++,Ee(F,k),se(Ue.tex,0),e.uniform1i(F.u.uTex,0),e.uniform2f(F.u.uTexel,1/Ue.w,1/Ue.h),e.uniform1f(F.u.uDecode,B?0:1),e.uniform1f(F.u.uPack,nt),e.uniform1f(F.u.uThreshold,.85),Te();const Ce=(Ht,We,Xt,qt)=>{Ee(Q,We),se(Ht.tex,0),e.uniform1i(Q.u.uTex,0),e.uniform2f(Q.u.uStep,Xt/We.w,qt/We.h),Te()};Ce(k,H,1,0),Ce(H,k,0,1),Ce(k,H,2.6,0),Ce(H,k,0,2.6),Ee(x,null),se(Ue.tex,0),se(k.tex,1),e.uniform1i(x.u.uScene,0),e.uniform1i(x.u.uBloom,1),e.uniform2f(x.u.uRes,xe,ge),e.uniform1f(x.u.uDecode,B?0:1),e.uniform1f(x.u.uPack,nt),e.uniform1f(x.u.uGlow,Math.max(0,t.glow)*.26),e.uniform1f(x.u.uExposure,Math.max(.05,t.exposure)),e.uniform1f(x.u.uVignette,Math.max(0,Math.min(1,t.vignette))),e.uniform1f(x.u.uScrimDir,t.scrim==="left"?1:t.scrim==="right"?2:t.scrim==="top"?3:t.scrim==="bottom"?4:0),e.uniform1f(x.u.uScrimAmt,Math.max(0,Math.min(1,t.scrimStrength))),e.uniform1f(x.u.uSeed,r*60%1e3),Te()}function ze(r){for(let t=0;t<r;t++)ut(Be)}function ft(r){if(J=0,!lt())return;if(r<st){J=requestAnimationFrame(ft);return}const t=ie?Math.min(.05,(r-ie)/1e3):0;ie=r,st=r+1e3/30,oe||(Be+=t),ut(Be),_e()}if(!ot()){he("build-failed");return}let le=0,Ut=0;const mt=()=>{if(le=0,!tt(Ut++)){le=requestAnimationFrame(mt);return}if(!at()){he("build-failed");return}Ie(),ze(oe?4:1),ie=0,_e(),Ct()},dt=new ResizeObserver(()=>{Ie(),(oe||V.current.paused)&&ze(4)}),Ct=()=>dt.observe(ne),ht=new IntersectionObserver(r=>{var t;Oe=((t=r[0])==null?void 0:t.isIntersecting)??!0,Oe?_e():Pe()},{threshold:0});ht.observe(ne);const pt=()=>{document.hidden?Pe():_e()},vt=r=>{r.preventDefault(),ke=!1,Pe(),_.style.display="none"},xt=()=>{if(xe=ge=Ne=je=0,!ot()){he("lost");return}ye=e.getExtension("KHR_parallel_shader_compile");let r=0;const t=()=>{if(le=0,!tt(r++)){le=requestAnimationFrame(t);return}if(!at()){he("lost");return}_.style.display="",ne.dataset.webgl="",Ie(),ke=!0,ie=0,ze(oe?4:1),_e()};t()};return document.addEventListener("visibilitychange",pt),_.addEventListener("webglcontextlost",vt),_.addEventListener("webglcontextrestored",xt),mt(),()=>{ke=!1,Pe(),le&&cancelAnimationFrame(le),dt.disconnect(),ht.disconnect(),document.removeEventListener("visibilitychange",pt),_.removeEventListener("webglcontextlost",vt),_.removeEventListener("webglcontextrestored",xt),it(),Fe&&e.deleteBuffer(Fe);for(const t of[ae,O,F,Q,x])t&&e.deleteProgram(t.program);const r=new Set([ae,O,F,Q,x].filter(Boolean).map(t=>t.program));for(const t of be)t&&!r.has(t)&&e.deleteProgram(t)}},[i]),n.jsxs("div",{ref:Ve,className:`relative isolate h-full w-full overflow-hidden bg-black ${o}`,...Dt,children:[n.jsx("canvas",{ref:Qe,"aria-hidden":"true",className:"absolute inset-0 h-full w-full"}),u?n.jsx("div",{className:"relative z-10 h-full w-full",children:u}):null]})}function Mt(){if(typeof window>"u")return null;const i=window;return i.SpeechRecognition||i.webkitSpeechRecognition||null}function hr(i){const[h,p]=f.useState(!1),[E,A]=f.useState(null),m=f.useRef(null),y=f.useRef(i);y.current=i;const j=!!Mt();f.useEffect(()=>()=>{var b;(b=m.current)==null||b.abort()},[]);const re=f.useCallback(()=>{var b;(b=m.current)==null||b.stop(),p(!1)},[]),X=f.useCallback(()=>{const b=Mt();if(!b)return;if(m.current){m.current.abort(),m.current=null,p(!1);return}const c=new b;m.current=c,c.lang=typeof navigator<"u"&&navigator.language||"en-US",c.continuous=!1,c.interimResults=!0,A(null),c.onresult=v=>{var D;let q="",W=!1;for(let T=v.resultIndex;T<v.results.length;T++){const U=v.results[T];q+=((D=U[0])==null?void 0:D.transcript)??"",U.isFinal&&(W=!0)}const g=q.trim();g&&y.current(g,W)},c.onerror=v=>{A((v==null?void 0:v.error)==="not-allowed"||(v==null?void 0:v.error)==="service-not-allowed"?"permission-denied":"unavailable"),m.current=null,p(!1)},c.onend=()=>{m.current=null,p(!1)};try{c.start(),p(!0)}catch{m.current=null,p(!1),A("unavailable")}},[]),I=f.useCallback(()=>A(null),[]);return{supported:j,listening:h,error:E,start:X,stop:re,clearError:I}}const At=2,pr=()=>n.jsx("svg",{viewBox:"0 0 24 24",width:"20",height:"20",fill:"currentColor","aria-hidden":"true",children:n.jsx("path",{d:"M12 1a5 5 0 0 1 5 5v5a5 5 0 0 1-10 0V6a5 5 0 0 1 5-5Zm6.063 13.5a1 1 0 1 1 1.73 1A8.998 8.998 0 0 1 13 19.942V22a1 1 0 1 1-2 0v-2.058A8.999 8.999 0 0 1 4.206 15.5a1 1 0 0 1 1.731-1A7.002 7.002 0 0 0 18.063 14.5Z"})});function wr(){const i=St(ar),h=St(ir),[p,E]=Yt(),A=p.get("q")||"",[m,y]=f.useState(A),[j,re]=f.useState(A.trim()),[X,I]=f.useState(Ye),b=f.useRef(null),c=nr("(max-width: 767px)"),{hideHentai:v,animations:q,reduceMotion:W}=Vt();or(i("title.page"));const g=m.trim(),D=g.length>=At,T=D&&j===g;f.useEffect(()=>{const o=p.get("q")||"";y(u=>u===o?u:o)},[p]),f.useEffect(()=>{const o=window.setTimeout(()=>re(g),250);return()=>window.clearTimeout(o)},[g]),f.useEffect(()=>{const o=window.setTimeout(()=>{var u;return(u=b.current)==null?void 0:u.focus()},c?180:0);return()=>window.clearTimeout(o)},[c]);const U=f.useCallback(o=>{const u=o.trim();u.length<At||(Qt(u),I(Ye()),E({q:u},{replace:!0}))},[E]),S=hr((o,u)=>{y(o),u&&U(o)}),w=Wt({queryKey:["search-anime",j],queryFn:()=>rr(j).then(o=>o.items),enabled:T,retry:!1,staleTime:6e4}),C=f.useMemo(()=>T?Zt(w.data||[],v):[],[v,T,w.data]),Y=D&&(!T||w.isPending||w.isFetching&&C.length===0),K=T&&w.isError&&!w.isFetching,Re=K&&C.length>0,de=o=>{y(o);const u=new URLSearchParams(p);o?u.set("q",o):u.delete("q"),E(u,{replace:!0})},Me=o=>{o.preventDefault(),U(g)},Ae=o=>{tr(o),I(Ye())};return n.jsxs("section",{className:"search-page",children:[n.jsx("div",{className:"search-page__scene","aria-hidden":"true",children:n.jsx(dr,{focus:c?[.5,.78]:[.76,.45],scrim:c?"top":"left",scrimStrength:c?.92:.82,distance:24,elevation:c?-7:-5.5,fov:c?58:42,glow:c?.72:.9,steps:c?150:190,resolution:c?.48:.56,maxDpr:1.25,motionEnabled:q&&!W})}),n.jsxs("div",{className:"search-page__content",children:[n.jsxs("header",{className:"search-page__header",children:[n.jsx("h1",{children:i("title.page")}),n.jsxs("form",{className:"search-page__form",role:"search",onSubmit:Me,children:[n.jsx(Jt,{size:21,"aria-hidden":"true"}),n.jsx("input",{ref:b,"data-search-page-input":"",type:"search",inputMode:"search",enterKeyHint:"search",autoComplete:"off",spellCheck:!1,"aria-label":h("label.search"),placeholder:i("field.desktopPlaceholder"),value:m,onChange:o=>de(o.target.value)}),Y&&n.jsx($t,{size:"xs"}),!Y&&m&&n.jsx("button",{type:"button",className:"search-page__icon-button","aria-label":h("a11y.clearSearch"),onClick:()=>de(""),children:n.jsx(Rt,{size:17,"aria-hidden":"true"})}),S.supported&&n.jsx("button",{type:"button",className:`search-page__icon-button${S.listening?" is-listening":""}`,"aria-label":h(S.listening?"a11y.voiceSearchStop":"a11y.voiceSearch"),"aria-pressed":S.listening,onClick:S.listening?S.stop:S.start,children:n.jsx(pr,{})})]}),!D&&n.jsx("p",{children:i("prompt.minCharacters")}),S.error&&n.jsx("p",{className:"search-page__error",role:"alert",children:i(S.error==="permission-denied"?"voice.permissionDenied":"voice.unavailable")})]}),n.jsxs("div",{className:"search-page__results",children:[!D&&X.length>0&&n.jsxs("section",{className:"search-page__recent","aria-labelledby":"search-recent-title",children:[n.jsxs("div",{className:"search-page__section-head",children:[n.jsx("h2",{id:"search-recent-title",children:i("title.recent")}),n.jsx("button",{type:"button",onClick:()=>{er(),I([])},children:i("action.clearRecent")})]}),n.jsx("div",{className:"search-page__recent-list",children:X.map(o=>n.jsxs("span",{className:"search-page__recent-chip",children:[n.jsx("button",{type:"button",onClick:()=>{y(o),U(o)},children:o}),n.jsx("button",{type:"button","aria-label":i("a11y.removeRecent",{query:o}),onClick:()=>Ae(o),children:n.jsx(Rt,{size:13,"aria-hidden":"true"})})]},o))})]}),D&&n.jsxs("section",{"aria-labelledby":"search-results-title",children:[n.jsxs("div",{className:"search-page__section-head",children:[n.jsx("h2",{id:"search-results-title",children:i("title.results")}),!Y&&!K&&n.jsx("p",{"aria-live":"polite",children:i("meta.results",{count:C.length})})]}),K&&n.jsxs("div",{className:"search-page__notice",role:"alert",children:[n.jsx("p",{children:Re?i("status.stale",{query:g}):i("status.error",{query:g})}),n.jsx("button",{type:"button",onClick:()=>{w.refetch()},children:i("action.retry")})]}),Y&&C.length===0?n.jsx("div",{className:"search-page__grid anime-card-grid",role:"status","aria-label":i("status.searching",{query:g}),children:Array.from({length:c?4:8}).map((o,u)=>n.jsx("div",{className:"search-page__skeleton skeleton"},u))}):C.length>0?n.jsx("div",{className:"search-page__grid anime-card-grid",children:C.map((o,u)=>n.jsx(Kt,{a:o,index:u,priority:u<6},`${o.source||"anime"}:${o.id}`))}):K?null:n.jsx("p",{className:"search-page__empty",children:i("empty.results",{query:g})})]})]})]})]})}export{wr as default};
