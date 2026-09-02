import json
from django.test import Client
from specifyweb.specify.tests.test_api import ApiTests


class TestClientError(ApiTests):
    def test_beacon_is_logged_and_returns_204(self):
        c = Client()
        with self.assertLogs('specifyweb.client_error', level='ERROR') as logs:
            response = c.post('/context/client_error/',
                              json.dumps({'message': 'boom', 'stack': 'at x', 'url': 'http://t/specify/'}),
                              content_type='application/json')
        self._assertStatusCodeEqual(response, 204)
        self.assertIn('message=boom', logs.output[0])

    def test_rejects_bad_json_and_oversized_bodies(self):
        c = Client()
        self._assertStatusCodeEqual(
            c.post('/context/client_error/', 'not json', content_type='application/json'), 400)
        self._assertStatusCodeEqual(
            c.post('/context/client_error/', json.dumps({'message': 'x' * 9000}), content_type='application/json'), 413)
