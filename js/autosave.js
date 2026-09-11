export function debounce(fn, wait=450){let t;return(...args)=>{clearTimeout(t);t=setTimeout(()=>fn(...args),wait)}}
