/**
 * Test the Javascript helpers shared client-side and server-side.
 */

'use strict';

var testutil = require(__dirname + '/../modules/testutil.js');

exports.lang = {

  testNumericStrToNum: function(test) {
    var convert = mainevent.shared.Lang.numericStrToNum,
        obj = {
          a: {
            b: {
              num0: '300',
              num1: '300.31',
              num2: '0.31',
              notNum0: '300d',
              notNum1: 'd300'
            }
          }
        },
        arr = [
          '300',
          '300.31',
          '0.31',
          '300d',
          'd300'
        ],
        date = new Date();

    var actual = convert(obj);
    test.strictEqual(actual.a.b.num0, 300);
    test.strictEqual(actual.a.b.num1, 300.31);
    test.strictEqual(actual.a.b.num2, 0.31);
    test.strictEqual(actual.a.b.notNum0, '300d');
    test.strictEqual(actual.a.b.notNum1, 'd300');
    test.strictEqual(actual.a.b.notNum1, 'd300');

    actual = convert(arr);
    test.strictEqual(actual[0], 300);
    test.strictEqual(actual[1], 300.31);
    test.strictEqual(actual[2], 0.31);
    test.strictEqual(actual[3], '300d');
    test.strictEqual(actual[4], 'd300');

    test.strictEqual(convert('300'), 300);
    test.strictEqual(convert('300.31'), 300.31);
    test.strictEqual(convert('0.31'), 0.31);
    test.strictEqual(convert('300d'), '300d');
    test.strictEqual(convert('d300'), 'd300');
    test.strictEqual(convert(undefined), undefined);
    test.strictEqual(convert('127.0.0.1'), '127.0.0.1');

    // Verify constructor filter.
    test.strictEqual(convert(date).getTime(), date.getTime());
    test.done();
  }
};
