/* VW-200 free-trial application form → email-api POST /api/trial */
(function () {
  var form = document.getElementById('trial-form');
  if (!form) return;

  var EMAIL_RE = /^[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/;

  /* ---- source tag (?src=) ---- */
  var src = '';
  try {
    src = (new URLSearchParams(location.search).get('src') || '').slice(0, 60);
    if (src) sessionStorage.setItem('vivebio_trial_src', src);
    else src = sessionStorage.getItem('vivebio_trial_src') || '';
  } catch (_) {}
  src = src.replace(/[^\w\u4e00-\u9fa5.\-]/g, '');
  var srcMap = [[/^(gzh|wx|wechat|mp|oa)/i, '公众号'], [/^(xhs|redbook)/i, '小红书'], [/^(mail|email|edm)/i, '邮件邀约'], [/^(ref|friend)/i, '朋友推荐']];
  var sel = document.getElementById('t-source');
  for (var k = 0; k < srcMap.length; k++) if (srcMap[k][0].test(src)) { sel.value = srcMap[k][1]; break; }

  function toggleOther(trigger, input) {
    var on = trigger.type === 'checkbox' ? trigger.checked : trigger.value === '其他';
    input.style.display = on ? 'block' : 'none';
  }
  var useOtherCb = document.getElementById('t-use-other-cb');
  var useOther = document.getElementById('t-use-other');
  var srcOther = document.getElementById('t-source-other');
  useOtherCb.addEventListener('change', function () { toggleOther(useOtherCb, useOther); });
  sel.addEventListener('change', function () { toggleOther(sel, srcOther); });
  var citySel = document.getElementById('t-city');
  var cityOther = document.getElementById('t-city-other');
  citySel.addEventListener('change', function () { toggleOther(citySel, cityOther); });

  var emailErr = document.getElementById('t-email-err');

  var result = document.getElementById('t-result');
  var btn = document.getElementById('t-submit');

  function setInvalid(f, bad) {
    var el = form.querySelector('.field[data-f="' + f + '"]');
    if (el) el.classList.toggle('invalid', !!bad);
    return !bad;
  }

  function collect() {
    var fd = new FormData(form);
    return {
      name: (fd.get('name') || '').trim(),
      org: (fd.get('org') || '').trim(),
      dept: (fd.get('dept') || '').trim(),
      email: (fd.get('email') || '').trim().toLowerCase(),
      phone: (fd.get('phone') || '').trim(),
      address: (fd.get('address') || '').trim(),
      uses: fd.getAll('uses'),
      use_other: (fd.get('use_other') || '').trim(),
      source: fd.get('source') || '',
      source_other: (fd.get('source_other') || '').trim(),
      src: src,
      consent: document.getElementById('t-consent').checked,
      demo_visit: document.getElementById('t-demo').checked,
      city: citySel.value,
      city_other: (fd.get('city_other') || '').trim(),
      website: fd.get('website') || '',
      page: location.pathname
    };
  }

  function validate(d) {
    var ok = true;
    ok = setInvalid('name', !d.name) && ok;
    ok = setInvalid('org', !d.org) && ok;
    ok = setInvalid('dept', !d.dept) && ok;
    ok = setInvalid('email', !EMAIL_RE.test(d.email)) && ok;
    ok = setInvalid('city', d.demo_visit && (!d.city || (d.city === '其他' && !d.city_other))) && ok;
    ok = setInvalid('phone', !/^[+\d][\d\s-]{6,19}$/.test(d.phone)) && ok;
    ok = setInvalid('address', d.address.length < 6) && ok;
    ok = setInvalid('uses', !d.uses.length) && ok;
    ok = setInvalid('consent', !d.consent) && ok;
    return ok;
  }

  function summary(d) {
    return [
      'VW-200 试用申请',
      '姓名：' + d.name, '单位：' + d.org, '科室/课题组：' + d.dept,
      '单位邮箱：' + d.email, '手机：' + d.phone, '收件地址：' + d.address,
      '主要用途：' + d.uses.join('、') + (d.use_other ? '（' + d.use_other + '）' : ''),
      '从哪里知道我们：' + (d.source || '未填') + (d.source_other ? '（' + d.source_other + '）' : '') + (d.src ? '｜src=' + d.src : ''),
      '城市：' + (d.city ? d.city + (d.city === '其他' && d.city_other ? '（' + d.city_other + '）' : '') : '未填'),
      '希望预约上门演示：' + (d.demo_visit ? '是' : '否')
    ].join('\n');
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function showFail(d, msg) {
    var text = summary(d);
    var mailto = 'mailto:sales@vivebio.cn?subject=' + encodeURIComponent('VW-200 试用申请｜' + d.org + '-' + d.name) + '&body=' + encodeURIComponent(text);
    result.className = 'note trial-result show fail';
    result.innerHTML =
      '<strong>' + esc(msg || '提交失败，请加微信或发邮件至 sales@vivebio.cn') + '</strong>' +
      '<div style="margin-top:0.35rem">您填写的信息还在，可一键复制后发给我们，我们会尽快人工处理。</div>' +
      '<div class="fb-row"><img src="assets/qr-support.jpg" alt="览微生物微信客服二维码" />' +
      '<div class="fb-actions"><button type="button" class="btn btn-ghost" id="t-copy">复制申请信息</button>' +
      '<a class="btn btn-ghost" href="' + mailto + '">用邮件发送至 sales@vivebio.cn</a>' +
      '<span style="font-size:0.82rem;color:#9aa8bc">微信扫码添加客服，粘贴申请信息即可</span></div></div>';
    document.getElementById('t-copy').addEventListener('click', function () {
      var b = this;
      function done() { b.textContent = '已复制'; }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
      function fallback() {
        var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (_) { window.prompt('请手动复制：', text); }
        document.body.removeChild(ta);
      }
    });
  }

  function showOk(d, appNo) {
    result.className = 'note trial-result show ok';
    var body = (appNo ? '申请编号 <b>' + esc(appNo) + '</b>。' : '') +
      '试用条款已发送至 <b>' + esc(d.email) + '</b>，请查收（如未收到请看看垃圾邮件箱），并从该邮箱直接回复「确认」。我们会告知您的排队顺序与预计发货时间。';
    result.innerHTML = '<strong>申请已提交，谢谢！</strong><div style="margin-top:0.35rem">' + body + '</div>';
    form.querySelectorAll('input,textarea,select,button').forEach(function (el) { el.disabled = true; });
    btn.textContent = '已提交';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = collect();
    result.className = 'note trial-result';
    if (!validate(d)) {
      var first = form.querySelector('.field.invalid');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    var endpoint = (window.VIVEBIO_TRIAL_ENDPOINT || '').replace(/\/+$/, '');
    if (!endpoint) { showFail(d); return; }
    btn.disabled = true; btn.textContent = '提交中…';
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 45000);
    fetch(endpoint + '/api/trial', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d), signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      return r.json().catch(function () { return { ok: false }; }).then(function (j) { return { status: r.status, j: j }; });
    }).then(function (x) {
      if (x.j && x.j.ok) return showOk(d, x.j.app_no);
      if (x.status === 400 && x.j && x.j.message) { showFail(d, x.j.message); return; }
      showFail(d);
    }).catch(function () { showFail(d); }).then(function () {
      clearTimeout(timer);
      if (!result.classList.contains('ok')) { btn.disabled = false; btn.textContent = '提交申请'; }
    });
  });
})();
