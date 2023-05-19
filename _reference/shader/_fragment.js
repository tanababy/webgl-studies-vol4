export const fragmentShader = /* glsl */`
varying vec2 vUv;
uniform vec2 u_resolution;
uniform vec2 u_imageResolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D u_image;

vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}

float cnoise(vec2 P){
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x,gy.x);
  vec2 g10 = vec2(gx.y,gy.y);
  vec2 g01 = vec2(gx.z,gy.z);
  vec2 g11 = vec2(gx.w,gy.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 * 
    vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
  g00 *= norm.x;
  g01 *= norm.y;
  g10 *= norm.z;
  g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
}

float map(float value, float min1, float max1, float min2, float max2) {
    float v = clamp(value, min1, max1);
    return min2 + (v - min1) * (max2 - min2) / (max1 - min1);
}

const float radius = 0.3;

void main() {
    vec2 ratio = vec2(
        min((u_resolution.x / u_resolution.y) / (u_imageResolution.x / u_imageResolution.y), 1.0),
        min((u_resolution.y / u_resolution.x) / (u_imageResolution.y / u_imageResolution.x), 1.0)
    );
    vec2 uv = vec2(
        vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
        vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );

    float n = cnoise(uv * 3.0 + u_time) * 0.02;

    // float dist = distance(u_mouse, vUv) + n;
    float dist = distance(u_mouse, vUv);

    float limit = 1.0 - smoothstep(radius - 0.008, radius, dist);

    float range = map(dist, 0.1, radius, 0.0, 1.0);//distを0.1〜radiusから0.0〜1.0に
    range = pow(range, 3.0);
    // uvからマウスへの方向を求める。大きさは、曲げる量になる。
    vec2 refractPower = (uv - u_mouse) * 0.2;
    // 曲げる量をもとめる。屈折の強さ（+方向） * 範囲
    vec2 distortion = refractPower * range;

    float inCircle_r = texture2D(u_image, uv - distortion).r;
    float inCircle_g = texture2D(u_image, uv - distortion).g;
    float inCircle_b = texture2D(u_image, uv - distortion).b;
    // vec3 inCircle = vec3(inCircle_r, inCircle_g, inCircle_b);
    vec3 inCircle = texture2D(u_image, uv - distortion).rgb;

    float shadow = smoothstep(radius, radius + 0.07, dist);
    shadow = shadow * 0.1 + 0.9;

    vec4 tex = texture2D(u_image, uv);

    vec3 color = mix(vec3(0.0), tex.rgb, shadow);
    color = mix(color, inCircle, limit);

    gl_FragColor = vec4(inCircle, 1.0);
    // gl_FragColor = vec4(shadow, 0.0, 0.0, 1.0);
    // gl_FragColor = vec4(uv, 0.0, 1.0);
    // gl_FragColor = texture2D(u_image, uv);
    gl_FragColor = vec4(color, 1.0);
}

`