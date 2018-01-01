if (typeof window === 'undefined') {
  var expect = require('expect.js');
  var recursiveKeys = require('../index');
}


var dumpKeysRecursively = recursiveKeys.dumpKeysRecursively;


describe('recursive-keys', function(){
  it('モジュールが定義されている', function(){
    expect(recursiveKeys).to.be.a('object');
  });


  describe('_isArray', function(){
    it('正しく動いている', function(){
      expect(recursiveKeys._isArray(null)).to.be(false);
      expect(recursiveKeys._isArray(undefined)).to.be(false);
      expect(recursiveKeys._isArray(1)).to.be(false);
      expect(recursiveKeys._isArray('abc')).to.be(false);
      expect(recursiveKeys._isArray({})).to.be(false);
      expect(recursiveKeys._isArray({0:1})).to.be(false);
      expect(recursiveKeys._isArray([])).to.be(true);
      expect(recursiveKeys._isArray([0, 1, 2])).to.be(true);
      expect(recursiveKeys._isArray(new Array([]))).to.be(true);
    });
  });


  describe('_isString', function(){
    it('正しく動いている', function(){
      expect(recursiveKeys._isString(null)).to.be(false);
      expect(recursiveKeys._isString(undefined)).to.be(false);
      expect(recursiveKeys._isString(1)).to.be(false);
      expect(recursiveKeys._isString('')).to.be(true);
      expect(recursiveKeys._isString('abc')).to.be(true);
      expect(recursiveKeys._isString(new String('abc'))).to.be(true);
      expect(recursiveKeys._isString({})).to.be(false);
      expect(recursiveKeys._isString({a:1, b:2})).to.be(false);
      expect(recursiveKeys._isString([])).to.be(false);
      expect(recursiveKeys._isString(['a', 'b'])).to.be(false);
    });
  });


  describe('dumpKeysRecursively', function(){
    it('文字列・辞書・配列以外の場合', function(){
      expect(dumpKeysRecursively(null)).to.eql([]);
      expect(dumpKeysRecursively(undefined)).to.eql([]);
      expect(dumpKeysRecursively(1)).to.eql([]);
    });

    it('文字列の場合', function(){
      expect(dumpKeysRecursively('')).to.eql([]);
      expect(dumpKeysRecursively('abc')).to.eql([]);
    });

    it('単層の辞書の場合', function(){
      expect(dumpKeysRecursively({x:1, y:2, z:3}).sort()).to.eql(['x', 'y', 'z']);
    });

    it('単層の配列の場合', function(){
      expect(dumpKeysRecursively([1, 2, 3])).to.eql(['0', '1', '2']);
    });

    it('ネストした辞書の場合', function(){
      expect(dumpKeysRecursively(
        {
          x: {
            y: [
              {
                z: 1
              }
            ]
          }
        }
      ).sort()).to.eql([
        'x',
        'x.y',
        'x.y.0',
        'x.y.0.z'
      ]);
    });

    it('ネストした配列の場合', function(){
      expect(dumpKeysRecursively(
        [
          [
            {
              a: [
                1
              ]
            }
          ]
        ]
      ).sort()).to.eql([
        '0',
        '0.0',
        '0.0.a',
        '0.0.a.0'
      ]);
    });

    it('複数要素を持つ配列の場合', function(){
      expect(dumpKeysRecursively(
        [
          {
            a: 1,
            b: 2
          },
          {
            x: 1,
            y: 2
          },
          [
            1,
            2
          ]
        ]
      ).sort()).to.eql([
        '0',
        '0.a',
        '0.b',
        '1',
        '1.x',
        '1.y',
        '2',
        '2.0',
        '2.1'
      ]);
    });

    it('複雑なデータの場合', function(){
      expect(dumpKeysRecursively({
        x: {
          a: 11,
          b: 22,
          c: [null, undefined]
        },
        y: {
          foo: {
            bar: {
              baz: 'str'
            }
          }
        },
        z: 3
      }).sort()).to.eql([
        'x',
        'x.a',
        'x.b',
        'x.c',
        'x.c.0',
        'x.c.1',
        'y',
        'y.foo',
        'y.foo.bar',
        'y.foo.bar.baz',
        'z'
      ]);
    });
  });
});
