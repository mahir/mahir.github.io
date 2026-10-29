"""Tests for _prices.py:  python3 works/005/_test_prices.py"""

import importlib.util
import json
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('prices', Path(__file__).with_name('_prices.py'))
prices = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prices)


def days(n, start=1):
    return [f'2026-01-{d:02d}' for d in range(start, start + n)]


class ParseRows(unittest.TestCase):
    def test_newest_first_becomes_oldest_first(self):
        rows = [{'date': '10/28/2026', 'close': '$61.99'}, {'date': '10/27/2026', 'close': '$1,234.5'}]
        self.assertEqual(prices.parse_rows(rows), [('2026-10-27', 1234.5), ('2026-10-28', 61.99)])

    def test_skips_rows_without_a_close(self):
        rows = [{'date': '10/28/2026', 'close': 'N/A'}, {'date': '10/27/2026'}, {'date': '10/26/2026', 'close': '$0'}]
        self.assertEqual(prices.parse_rows(rows), [])
        self.assertEqual(prices.parse_rows(None), [])


class Align(unittest.TestCase):
    def test_keeps_the_last_days_on_one_calendar(self):
        series = {'A': list(zip(days(6), [1, 2, 3, 4, 5, 6])), 'B': list(zip(days(6), [6, 5, 4, 3, 2, 1]))}
        dates, closes = prices.align(series, days=4)
        self.assertEqual(dates, days(4, start=3))
        self.assertEqual(closes, {'A': [3, 4, 5, 6], 'B': [4, 3, 2, 1]})

    def test_fills_a_missing_day_from_the_one_before(self):
        a = list(zip(days(5), [1, 2, 3, 4, 5]))
        b = [r for r in zip(days(5), [9, 8, 7, 6, 5]) if r[0] != '2026-01-04']
        dates, closes = prices.align({'A': a, 'B': b, 'C': a}, days=3)
        self.assertEqual(closes['B'], [7, 7, 5])

    def test_leaves_out_a_company_with_too_many_gaps(self):
        a = list(zip(days(8), range(8)))
        b = [r for i, r in enumerate(zip(days(8), range(8))) if i % 2 == 0]
        dates, closes = prices.align({'A': a, 'B': b, 'C': a}, days=6, gaps=2)
        self.assertNotIn('B', closes)
        self.assertIn('A', closes)

    def test_leaves_out_a_company_that_starts_late(self):
        a = list(zip(days(6), range(6)))
        late = list(zip(days(3, start=4), range(3)))
        dates, closes = prices.align({'A': a, 'B': a, 'L': late}, days=5, gaps=3)
        self.assertNotIn('L', closes)

    def test_too_short_a_history_gives_nothing(self):
        self.assertEqual(prices.align({'A': list(zip(days(3), range(3)))}, days=5), ([], {}))


class Cliff(unittest.TestCase):
    def test_finds_a_fall_of_more_than_forty_percent(self):
        self.assertEqual(prices.cliff(days(4), [464.42, 470, 227.8, 230]), '2026-01-03')

    def test_lets_real_moves_through(self):
        self.assertIsNone(prices.cliff(days(4), [100, 61, 160, 120]))
        self.assertIsNone(prices.cliff(days(3), [62.96, 174.38, 133.32]))  # Moderna, August 2026: x2.77

    def test_finds_a_jump_like_a_reverse_split(self):
        self.assertEqual(prices.cliff(days(3), [10, 10.1, 30.2]), '2026-01-03')  # x2.99
        self.assertEqual(prices.cliff(days(3), [10, 10.1, 101]), '2026-01-03')  # x10


class Freshness(unittest.TestCase):
    def test_a_day_only_some_companies_have_waits(self):
        full = list(zip(days(5), range(5)))
        short = full[:-1]
        series = {f'C{i}': (full if i < 18 else short) for i in range(20)}  # 18 of 20 have the 5th day: 90%
        dates, closes = prices.align(series, days=3)
        self.assertEqual(dates[-1], '2026-01-04')
        series = {f'C{i}': (full if i < 19 else short) for i in range(20)}  # 95%
        self.assertEqual(prices.align(series, days=3)[0][-1], '2026-01-05')

    def test_the_file_never_moves_back(self):
        self.assertTrue(prices.moves_back('{"through":"2026-10-28"}', '2026-10-27'))
        self.assertFalse(prices.moves_back('{"through":"2026-10-28"}', '2026-10-28'))
        self.assertFalse(prices.moves_back('not json', '2026-10-28'))


class Writing(unittest.TestCase):
    def test_ninety_percent_must_come_back(self):
        self.assertTrue(prices.enough(90, 100))
        self.assertFalse(prices.enough(89, 100))
        self.assertFalse(prices.enough(0, 0))

    def test_render_is_valid_json_in_ticker_order(self):
        text = prices.render(days(2), {'B': [1.5, 2], 'A': [3, 4]}, {'A': 'Apple', 'B': 'Bé', 'X': 'gone'})
        data = json.loads(text)
        self.assertEqual(data['through'], '2026-01-02')
        self.assertEqual([t['t'] for t in data['tickers']], ['A', 'B'])
        self.assertEqual(data['tickers'][1], {'t': 'B', 'name': 'Bé', 'closes': [1.5, 2]})
        self.assertEqual(len(text.splitlines()), 4)


if __name__ == '__main__':
    unittest.main()
