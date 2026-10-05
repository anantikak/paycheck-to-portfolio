(function(){
  const $ = id => document.getElementById(id);
  const usd = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});
  const usd0 = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
  const num = id => { const v = parseFloat($(id).value); return isFinite(v) && v >= 0 ? v : 0; };
  const plural = (n,w) => n + ' ' + w + (n === 1 ? '' : 's');
  const dur = m => { const y = Math.floor(m/12), r = m%12; return [y?plural(y,'year'):'', r?plural(r,'month'):''].filter(Boolean).join(' ') || '0 months'; };

  /* ---------- Budget ---------- */
  function budget(){
    const gross = num('b-wage') * num('b-hours') * 52 / 12;
    const fica = gross * 0.0765;
    const net = gross - fica;
    const needs = num('b-needs'), wants = num('b-wants');
    const left = net - needs - wants;
    $('b-gross').textContent = usd.format(gross);
    $('b-fica').textContent = '−' + usd.format(fica);
    $('b-net').textContent = usd.format(net);
    $('b-left').textContent = usd.format(left);
    $('b-left').style.color = left < 0 ? 'var(--bad)' : 'var(--good)';
    const total = Math.max(net, needs + wants, 1);
    const pct = v => Math.max(0, v) / total * 100;
    $('b-stack').innerHTML = '<i style="width:'+pct(needs)+'%;background:var(--warn)"></i><i style="width:'+pct(wants)+'%;background:var(--mark)"></i><i style="width:'+pct(left)+'%;background:var(--accent)"></i>';
    if (net <= 0) { $('b-compare').textContent = 'Enter a wage and hours to see your split.'; return; }
    const p = v => Math.round(Math.max(0,v) / net * 100);
    $('b-compare').textContent = left < 0
      ? 'Needs and wants add up to ' + usd.format(-left) + ' more than your pay after FICA each month.'
      : 'Your split: ' + p(needs) + '% needs, ' + p(wants) + '% wants, ' + p(left) + '% savings. The 50/30/20 rule of thumb would be ' + usd0.format(net*.5) + ' / ' + usd0.format(net*.3) + ' / ' + usd0.format(net*.2) + '.';
  }

  /* ---------- Emergency fund ---------- */
  function ef(){
    const goal = num('e-exp') * parseInt($('e-months').value,10);
    const have = num('e-have'), save = num('e-save');
    $('e-goal').textContent = usd.format(goal);
    const need = Math.max(0, goal - have);
    const pct = goal > 0 ? Math.min(100, have / goal * 100) : 0;
    $('e-bar').style.width = pct + '%';
    $('e-pct').textContent = Math.round(pct) + '% of the way there' + (need > 0 ? ', ' + usd.format(need) + ' to go.' : '.');
    if (need === 0) $('e-time').textContent = 'Goal reached';
    else if (save <= 0) $('e-time').textContent = 'Add a monthly amount';
    else $('e-time').textContent = dur(Math.ceil(need / save));
  }

  /* ---------- Credit card ---------- */
  function payoff(bal, apr, pay){
    const r = apr / 100 / 12; let m = 0, interest = 0;
    if (bal <= 0) return {months:0, interest:0};
    if (pay <= bal * r) return null;
    while (bal > 0.005 && m < 1200){
      const i = bal * r; interest += i; bal = bal + i - pay; m++;
      if (bal < 0) bal = 0;
    }
    return {months:m, interest:interest};
  }
  function cc(){
    const bal = num('c-bal'), apr = num('c-apr'), p1 = num('c-pay'), p2 = num('c-pay2');
    const a = payoff(bal, apr, p1), b = payoff(bal, apr, p2);
    $('c-l1').textContent = 'Paying ' + usd0.format(p1) + '/month';
    $('c-l2').textContent = 'Paying ' + usd0.format(p2) + '/month';
    $('c-r1').textContent = a ? dur(a.months) : 'Never: payment ≤ interest';
    $('c-i1').textContent = a ? usd.format(a.interest) : '—';
    $('c-r2').textContent = b ? dur(b.months) : 'Never: payment ≤ interest';
    $('c-i2').textContent = b ? usd.format(b.interest) : '—';
    if (a && b && a.interest !== b.interest){
      const diff = Math.abs(a.interest - b.interest);
      $('c-save').textContent = 'Difference in interest: ' + usd.format(diff);
    } else $('c-save').textContent = '';
  }

  /* ---------- Growth ---------- */
  function series(monthly, rate, fee, start){
    const r = Math.max(0, rate - fee) / 100 / 12; const pts = []; let bal = 0, contrib = 0;
    for (let age = start; age < 65; age++){
      for (let k = 0; k < 12; k++){ bal = bal * (1 + r) + monthly; contrib += monthly; }
      pts.push({age:age+1, bal:bal});
    }
    return {pts, bal, contrib};
  }
  function grow(){
    const m = num('g-monthly'), rate = num('g-rate'), fee = num('g-fee');
    const s1 = Math.min(64, Math.max(10, Math.round(num('g-start')) || 16));
    const s2 = Math.min(64, Math.max(10, Math.round(num('g-late')) || 26));
    const A = series(m, rate, fee, s1), B = series(m, rate, fee, s2);
    $('g-l1').textContent = 'Start at ' + s1 + ': at 65 (you put in ' + usd0.format(A.contrib) + ')';
    $('g-l2').textContent = 'Start at ' + s2 + ': at 65 (you put in ' + usd0.format(B.contrib) + ')';
    $('g-v1').textContent = usd0.format(A.bal);
    $('g-v2').textContent = usd0.format(B.bal);
    $('g-k1').textContent = 'Start at ' + s1; $('g-k2').textContent = 'Start at ' + s2;
    const net = Math.max(0, rate - fee);
    $('g-72').innerHTML = net > 0 ? 'Rule of 72: at ' + net.toFixed(2).replace(/\.?0+$/,'') + '% after fees, money doubles about every ' + (72/net).toFixed(1) + ' years. Divide 72 by the rate to estimate how long it takes to double.<sup class="cite"><a href="#s5">5</a></sup>' : '';
    drawChart(A, B, Math.min(s1, s2));
  }
  function niceMax(v){ if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
  function drawChart(A, B, minAge){
    const svg = $('g-chart'), W = 360, H = 170, L = 46, R = 8, T = 8, Bm = 22;
    const ymax = niceMax(Math.max(A.bal, B.bal));
    const x = a => L + (a - minAge) / (65 - minAge) * (W - L - R);
    const y = v => T + (1 - v / ymax) * (H - T - Bm);
    let g = '';
    for (let i = 0; i <= 4; i++){
      const v = ymax * i / 4, yy = y(v);
      g += '<line class="grid" x1="'+L+'" x2="'+(W-R)+'" y1="'+yy+'" y2="'+yy+'"/>';
      g += '<text x="'+(L-6)+'" y="'+(yy+3)+'" text-anchor="end">'+(v>=1000?'$'+Math.round(v/1000)+'k':'$'+Math.round(v))+'</text>';
    }
    const ticks = []; for (let a = Math.ceil(minAge/10)*10; a <= 65; a += 10) ticks.push(a);
    if (ticks[ticks.length-1] !== 65) ticks.push(65);
    ticks.forEach(a => { if (a - minAge >= 0) g += '<text x="'+x(a)+'" y="'+(H-6)+'" text-anchor="middle">'+a+'</text>'; });
    const line = (S, s0, color, w) => {
      const d = 'M' + x(s0) + ',' + y(0) + ' ' + S.pts.map(p => 'L' + x(p.age).toFixed(1) + ',' + y(p.bal).toFixed(1)).join(' ');
      return '<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="'+w+'" stroke-linejoin="round"/>';
    };
    const sA = A.pts.length ? A.pts[0].age - 1 : minAge, sB = B.pts.length ? B.pts[0].age - 1 : minAge;
    g += line(B, sB, 'var(--c-contrib)', 2.5) + line(A, sA, 'var(--c-growth)', 3);
    if (A.pts.length) g += '<circle cx="'+x(65)+'" cy="'+y(A.bal)+'" r="4" fill="var(--c-growth)"/>';
    svg.innerHTML = g;
  }

  [['b-',budget],['e-',ef],['c-',cc],['g-',grow]].forEach(([p,fn]) => {
    document.querySelectorAll('input[id^="'+p+'"],select[id^="'+p+'"]').forEach(el => el.addEventListener('input', fn));
    fn();
  });

  /* ---------- Quiz ---------- */
  const Q = [
    {q:'Your pay stub says gross pay is $300. What is your net pay?', o:['$300, the same thing','Less than $300, after taxes and withholding','More than $300, because your employer matches it'], a:1, w:'Net pay is what you take home after taxes are taken out. Gross pay is before taxes.', s:'s10'},
    {q:'What does the FDIC insure?', o:['Stocks and crypto you buy through a bank app','Deposits like checking and savings, up to $250,000 per depositor, per insured bank, per ownership category','Any money you lose in the stock market'], a:1, w:'FDIC insurance covers deposits. Stocks, bonds, mutual funds, and crypto are not covered.', s:'s7'},
    {q:'$100 earns 5% interest per year, compounded yearly. How much do you have after 2 years?', o:['$110.00','$110.25','$105.00'], a:1, w:'Year 1: $105. Year 2: 5% of $105 is $5.25, so $110.25. That extra 25 cents is interest on interest.', s:'s5'},
    {q:'Which factor carries the most weight in FICO scores for most people?', o:['Credit mix','New credit','Payment history'], a:2, w:'Payment history is about 35% of a FICO score for the general population.', s:'s21'},
    {q:'Where can you get your credit reports for free?', o:['AnnualCreditReport.com','Any site that advertises a "free credit score"','Only by paying a credit bureau'], a:0, w:'AnnualCreditReport.com is the only authorized place to get the free annual credit reports you’re entitled to by law. Look-alike sites may try to sell you something.', s:'s18'},
    {q:'You pay only the minimum on a credit card each month. What usually happens?', o:['The balance is gone in a few months','It can take years to pay off, and you pay more interest','Interest stops once you start paying'], a:1, w:'The CFPB warns that minimum payments can take years. Paying more each month means less interest overall.', s:'s24'},
    {q:'You are 16 and earned $3,000 from a summer job in 2026. What is the most you can put in an IRA for 2026?', o:['$0, because you are under 18','$3,000','$7,500'], a:1, w:'There is no age limit, but contributions can’t be more than your taxable compensation. The $7,500 cap only matters if you earned more than that.', s:'s37'},
    {q:'Someone online promises a "guaranteed" 40% return if you invest today using gift cards. This is…', o:['A great opportunity','A classic investment fraud red flag','Normal for crypto'], a:1, w:'Guaranteed returns, pressure to act now, and paying with gift cards are all red flags of fraud on the SEC’s list.', s:'s43'}
  ];
  const answered = {};
  function renderQuiz(){
    const list = $('quiz-list'); list.innerHTML = '';
    Q.forEach((item, i) => {
      const d = document.createElement('div'); d.className = 'q';
      const ask = document.createElement('p'); ask.className = 'ask'; ask.textContent = (i+1) + '. ' + item.q; d.appendChild(ask);
      const opts = document.createElement('div'); opts.className = 'opts'; opts.setAttribute('role','group'); opts.setAttribute('aria-label','Question ' + (i+1));
      const why = document.createElement('p'); why.className = 'why'; why.hidden = true;
      item.o.forEach((txt, j) => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = txt;
        b.addEventListener('click', () => {
          if (i in answered) return; answered[i] = j === item.a;
          opts.querySelectorAll('button').forEach((x, k) => { x.disabled = true; if (k === item.a) x.classList.add('right'); });
          if (j !== item.a) b.classList.add('wrong');
          why.innerHTML = '';
          const lead = document.createElement('b'); lead.textContent = j === item.a ? 'Correct. ' : 'Not quite. ';
          why.appendChild(lead); why.appendChild(document.createTextNode(item.w + ' '));
          const a = document.createElement('a'); a.href = '#' + item.s; a.textContent = 'Source'; why.appendChild(a);
          why.hidden = false; score();
        });
        opts.appendChild(b);
      });
      d.appendChild(opts); d.appendChild(why); list.appendChild(d);
    });
    score();
  }
  function score(){
    const n = Object.keys(answered).length, c = Object.values(answered).filter(Boolean).length;
    $('quiz-score').textContent = n === 0 ? '' : (n < Q.length ? c + ' of ' + n + ' correct so far' : 'You scored ' + c + ' out of ' + Q.length + '.');
  }
  $('quiz-reset').addEventListener('click', () => { for (const k in answered) delete answered[k]; renderQuiz(); });
  renderQuiz();
})();
