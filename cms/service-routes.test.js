'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const routes = require('./service-routes');

const service = {
  id: 2, status: 'published', title: 'Emprime Baskı',
  slug: 'emprime-baski', short_desc: 'Kumaş baskı hizmeti'
};

test('Turkish characters and spaces become a canonical URL slug', () => {
  assert.equal(routes._test.slugify('Emprime Baskı'), 'emprime-baski');
  assert.equal(routes._test.slugify('Özel Tişört Baskı'), 'ozel-tisort-baski');
  assert.equal(routes._test.match([service], 'emprimebaskı').id, 2);
  assert.equal(routes._test.match([service], 'emprime-baski').id, 2);
  assert.equal(routes._test.match([service], 'bilinmiyor'), null);
  assert.equal(routes._test.match([{ ...service, status: 'draft' }], 'emprime-baski'), null);
});

test('Wrong service URL redirects to valid CMS page; unpublished returns 404', async () => {
  let handler;
  routes({ get(route, fn) {
    assert.equal(route, '/hizmetlerimiz/:slug');
    handler = fn;
  } }, { root: '/nonexistent-test-root', directusUrl: 'http://127.0.0.1:8055' });

  const oldFetch = global.fetch;
  global.fetch = async () => ({ ok: true, json: async () => ({ data: [
    service, { id: 3, status: 'draft', title: 'Gizli', slug: 'gizli' }
  ] }) });

  async function request(requestPath, slug) {
    const result = { status: 200, redirect: '', body: '' };
    const res = {
      setHeader() {},
      status(code) { result.status = code; return this; },
      redirect(code, location) { result.status = code; result.redirect = location; return this; },
      type() { return this; },
      send(value) { result.body = value; return this; },
      sendFile(filepath) { result.body = filepath; return this; }
    };
    await handler({ path: requestPath, params: { slug } }, res);
    return result;
  }

  try {
    const bad = await request('/hizmetlerimiz/emprimebask%C4%B1/', 'emprimebaskı');
    assert.equal(bad.status, 301);
    assert.equal(bad.redirect, '/hizmetlerimiz/emprime-baski/');

    const good = await request('/hizmetlerimiz/emprime-baski/', 'emprime-baski');
    assert.equal(good.status, 200);
    assert.match(good.body, /Emprime Baskı/);

    const unknown = await request('/hizmetlerimiz/bilinmiyor/', 'bilinmiyor');
    assert.equal(unknown.status, 404);

    const draft = await request('/hizmetlerimiz/gizli/', 'gizli');
    assert.equal(draft.status, 404);
  } finally {
    global.fetch = oldFetch;
  }
});
