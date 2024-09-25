// (c) Copyright 2018 Micro Focus or one of its affiliates.

// Load the required files
const fs = require('fs');
const PIE = require('./getkey.js');



var SDW = {};
SDW.base10 = "0123456789";
SDW.base62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
SDW.luhn = function(a) {
    var e = a.length - 1;
    var b = 0;
    while (e >= 0) {
        b += parseInt(a.substr(e, 1), 10);
        e -= 2
    }
    e = a.length - 2;
    while (e >= 0) {
        var c = 2 * parseInt(a.substr(e, 1), 10);
        if (c < 10) {
            b += c
        } else {
            b += c - 9
        }
        e -= 2
    }
    return b % 10
}
;
SDW.fixluhn = function(b, d, c) {
    var a = SDW.luhn(b);
    if (a < c) {
        a += 10 - c
    } else {
        a -= c
    }
    if (a != 0) {
        if ((b.length - d) % 2 != 0) {
            a = 10 - a
        } else {
            if (a % 2 == 0) {
                a = 5 - (a / 2)
            } else {
                a = (9 - a) / 2 + 5
            }
        }
        return b.substr(0, d) + a + b.substr(d + 1)
    } else {
        return b
    }
}
;
SDW.distill = function(b) {
    var c = "";
    for (var a = 0; a < b.length; ++a) {
        if (SDW.base10.indexOf(b.charAt(a)) >= 0) {
            c += b.substr(a, 1)
        }
    }
    return c
}
;
SDW.reformat = function(d, c) {
    var e = "";
    var a = 0;
    for (var b = 0; b < c.length; ++b) {
        if (a < d.length && SDW.base10.indexOf(c.charAt(b)) >= 0) {
            e += d.substr(a, 1);
            ++a
        } else {
            e += c.substr(b, 1)
        }
    }
    return e
}
;
SDW.integrity = function(a, e, c) {
    var b = String.fromCharCode(0) + String.fromCharCode(e.length) + e + String.fromCharCode(0) + String.fromCharCode(c.length) + c;
    var d = AES.HexToWords(a);
    d[3] ^= 1;
    var f = new sjcl.cipher.aes(d);
    var g = CMAC.compute(f, b);
    return AES.WordToHex(g[0]) + AES.WordToHex(g[1])
}
;
function ProtectPANandCVV(t, o, k) {
    var l = SDW.distill(t);
    var r = SDW.distill(o);
    if (l.length < 13 || l.length > 19 || r.length > 4 || r.length == 1 || r.length == 2) {
        return null
    }
    var g = l.substr(0, PIE.L) + l.substring(l.length - PIE.E);
    if (k == true) {
        var p = SDW.luhn(l);
        var j = l.substring(PIE.L + 1, l.length - PIE.E);
        var f = FFX.encrypt(j + r, g, PIE.K, 10);
        var b = l.substr(0, PIE.L) + "0" + f.substr(0, f.length - r.length) + l.substring(l.length - PIE.E);
        var s = SDW.reformat(SDW.fixluhn(b, PIE.L, p), t);
        var q = SDW.reformat(f.substring(f.length - r.length), o);
        return [s, q, SDW.integrity(PIE.K, s, q)]
    }
    if (SDW.luhn(l) != 0) {
        return null
    }
    var j = l.substring(PIE.L + 1, l.length - PIE.E);
    var v = 23 - PIE.L - PIE.E;
    var h = j + r;
    var u = Math.floor((v * Math.log(62) - 34 * Math.log(2)) / Math.log(10)) - h.length - 1;
    var x = "11111111111111111111111111111".substr(0, u) + (2 * r.length);
    var f = "1" + FFX.encrypt(x + h, g, PIE.K, 10);
    var e = parseInt(PIE.key_id, 16);
    var a = new Array(f.length);
    var w;
    for (w = 0; w < f.length; ++w) {
        a[w] = parseInt(f.substr(w, 1), 10)
    }
    var d = FFX.convertRadix(a, f.length, 10, v, 62);
    FFX.bnMultiply(d, 62, 131072);
    FFX.bnMultiply(d, 62, 65536);
    FFX.bnAdd(d, 62, e);
    if (PIE.phase == 1) {
        FFX.bnAdd(d, 62, 4294967296)
    }
    var c = "";
    for (w = 0; w < v; ++w) {
        c = c + SDW.base62.substr(d[w], 1)
    }
    var s = l.substr(0, PIE.L) + c.substr(0, v - 4) + l.substring(l.length - PIE.E);
    var q = c.substring(v - 4);
    return [s, q, SDW.integrity(PIE.K, s, q)]
}
function ValidatePANChecksum(b) {
    var a = SDW.distill(b);
    return (a.length >= 13 && a.length <= 19 && SDW.luhn(a) == 0)
}
function ProtectString(g, h) {
    // Step 1: Encode the string in UTF-8 and log the result
    var f = SDW_UTF8.encode(g);
    console.log('UTF-8 Encoded String:', f);  // Log the UTF-8 encoded string

    if (f.length < 2 || f.length > 256) {
        return null;
    }

    // Step 2: Check for optional parameter 'h' and encode if necessary
    var b;
    if (h == null) {
        b = "";
    } else {
        b = SDW_UTF8.encode(h);
        if (b.length > 256) {
            return null;
        }
    }

    // Step 3: Prepare the AES key and log the transformed key
    var c = AES.HexToWords(PIE.K);
    console.log('AES Key Words:', c);  // Log the AES key in word format
    c[3] ^= 2;  // Modify the key for AES encryption

    var e = new sjcl.cipher.aes(c);

    // Step 4: Perform FFX encryption and log the result before Base64 encoding
    var a = FFX.encryptWithCipher(f, b, e, 256);
    console.log('Encrypted Output Before Base64:', a);  // Log the raw encrypted output

    // Step 5: Base64 encoding the encrypted output and logging it
    var d = Buffer.from(a).toString('base64');  // Standard Base64 encoding
    console.log('Base64 Encoded Result:', d);  // Log the Base64 encoded result

    return [d];


}
"use strict";
var sjcl = {
    cipher: {},
    hash: {},
    mode: {},
    misc: {},
    codec: {},
    exception: {
        corrupt: function(a) {
            this.toString = function() {
                return "CORRUPT: " + this.message
            }
            ;
            this.message = a
        },
        invalid: function(a) {
            this.toString = function() {
                return "INVALID: " + this.message
            }
            ;
            this.message = a
        },
        bug: function(a) {
            this.toString = function() {
                return "BUG: " + this.message
            }
            ;
            this.message = a
        }
    }
};
sjcl.cipher.aes = function(h) {
    if (!this._tables[0][0][0]) {
        this._precompute()
    }
    var d, c, e, g, l, f = this._tables[0][4], k = this._tables[1], a = h.length, b = 1;
    if (a !== 4 && a !== 6 && a !== 8) {
        throw new sjcl.exception.invalid("invalid aes key size")
    }
    this._key = [g = h.slice(0), l = []];
    for (d = a; d < 4 * a + 28; d++) {
        e = g[d - 1];
        if (d % a === 0 || (a === 8 && d % a === 4)) {
            e = f[e >>> 24] << 24 ^ f[e >> 16 & 255] << 16 ^ f[e >> 8 & 255] << 8 ^ f[e & 255];
            if (d % a === 0) {
                e = e << 8 ^ e >>> 24 ^ b << 24;
                b = b << 1 ^ (b >> 7) * 283
            }
        }
        g[d] = g[d - a] ^ e
    }
    for (c = 0; d; c++,
    d--) {
        e = g[c & 3 ? d : d - 4];
        if (d <= 4 || c < 4) {
            l[c] = e
        } else {
            l[c] = k[0][f[e >>> 24]] ^ k[1][f[e >> 16 & 255]] ^ k[2][f[e >> 8 & 255]] ^ k[3][f[e & 255]]
        }
    }
}
;
sjcl.cipher.aes.prototype = {
    encrypt: function(a) {
        return this._crypt(a, 0)
    },
    decrypt: function(a) {
        return this._crypt(a, 1)
    },
    _tables: [[[], [], [], [], []], [[], [], [], [], []]],
    _precompute: function() {
        var j = this._tables[0], q = this._tables[1], h = j[4], n = q[4], g, l, f, k = [], c = [], b, p, m, o, e, a;
        for (g = 0; g < 256; g++) {
            c[(k[g] = g << 1 ^ (g >> 7) * 283) ^ g] = g
        }
        for (l = f = 0; !h[l]; l ^= (b == 0) ? 1 : b,
        f = (c[f] == 0) ? 1 : c[f]) {
            o = f ^ f << 1 ^ f << 2 ^ f << 3 ^ f << 4;
            o = o >> 8 ^ o & 255 ^ 99;
            h[l] = o;
            n[o] = l;
            m = k[p = k[b = k[l]]];
            a = m * 16843009 ^ p * 65537 ^ b * 257 ^ l * 16843008;
            e = k[o] * 257 ^ o * 16843008;
            for (g = 0; g < 4; g++) {
                j[g][l] = e = e << 24 ^ e >>> 8;
                q[g][o] = a = a << 24 ^ a >>> 8
            }
        }
        for (g = 0; g < 5; g++) {
            j[g] = j[g].slice(0);
            q[g] = q[g].slice(0)
        }
    },
    _crypt: function(k, n) {
        if (k.length !== 4) {
            throw new sjcl.exception.invalid("invalid aes block size")
        }
        var y = this._key[n], v = k[0] ^ y[0], u = k[n ? 3 : 1] ^ y[1], t = k[2] ^ y[2], s = k[n ? 1 : 3] ^ y[3], w, e, m, x = y.length / 4 - 2, p, o = 4, q = [0, 0, 0, 0], r = this._tables[n], j = r[0], h = r[1], g = r[2], f = r[3], l = r[4];
        for (p = 0; p < x; p++) {
            w = j[v >>> 24] ^ h[u >> 16 & 255] ^ g[t >> 8 & 255] ^ f[s & 255] ^ y[o];
            e = j[u >>> 24] ^ h[t >> 16 & 255] ^ g[s >> 8 & 255] ^ f[v & 255] ^ y[o + 1];
            m = j[t >>> 24] ^ h[s >> 16 & 255] ^ g[v >> 8 & 255] ^ f[u & 255] ^ y[o + 2];
            s = j[s >>> 24] ^ h[v >> 16 & 255] ^ g[u >> 8 & 255] ^ f[t & 255] ^ y[o + 3];
            o += 4;
            v = w;
            u = e;
            t = m
        }
        for (p = 0; p < 4; p++) {
            q[n ? 3 & -p : p] = l[v >>> 24] << 24 ^ l[u >> 16 & 255] << 16 ^ l[t >> 8 & 255] << 8 ^ l[s & 255] ^ y[o++];
            w = v;
            v = u;
            u = t;
            t = s;
            s = w
        }
        return q
    }
};
var AES = {};
AES.HexToKey = function(a) {
    return new sjcl.cipher.aes(AES.HexToWords(a))
}
;
AES.HexToWords = function(a) {
    var d = 4;
    var c = new Array(d);
    if (a.length != d * 8) {
        return null
    }
    for (var b = 0; b < d; b++) {
        c[b] = parseInt(a.substr(b * 8, 8), 16)
    }
    return c
}
;
AES.Hex = "0123456789abcdef";
AES.WordToHex = function(a) {
    var c = 32;
    var b = "";
    while (c > 0) {
        c -= 4;
        b += AES.Hex.substr((a >>> c) & 15, 1)
    }
    return b
}
;
var SDW_Base64 = {
    _chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
    encode: function(d) {
        var b = 0;
        var e = "";
        var f, a;
        while (b < d.length) {
            f = d.charCodeAt(b) & 255;
            e += SDW_Base64._chars.charAt(f >> 2);
            a = (f & 3) << 4;
            if (++b < d.length) {
                f = d.charCodeAt(b) & 255;
                a |= f >> 4
            }
            e += SDW_Base64._chars.charAt(a);
            if (b >= d.length) {
                break
            }
            a = (f & 15) << 2;
            if (++b < d.length) {
                f = d.charCodeAt(b) & 255;
                a |= f >> 6
            }
            e += SDW_Base64._chars.charAt(a);
            if (b >= d.length) {
                break
            }
            e += SDW_Base64._chars.charAt(f & 63);
            ++b
        }
        return e
    }
};
var SDW_UTF8 = {
    encode: function(b) {
        var d = "";
        var a = 0;
        while (a < b.length) {
            var e = b.charCodeAt(a);
            if (e < 128) {
                d += String.fromCharCode(e)
            } else {
                if (e >= 2048) {
                    d += String.fromCharCode((e >> 12) | 224) + String.fromCharCode(((e >> 6) & 63) | 128) + String.fromCharCode((e & 63) | 128)
                } else {
                    d += String.fromCharCode((e >> 6) | 192) + String.fromCharCode((e & 63) | 128)
                }
            }
            ++a
        }
        return d
    }
};
var CMAC = {};
CMAC.MSBnotZero = function(a) {
    if ((a | 2147483647) == 2147483647) {
        return false
    } else {
        return true
    }
}
;
CMAC.leftShift = function(b) {
    b[0] = ((b[0] & 2147483647) << 1) | (b[1] >>> 31);
    b[1] = ((b[1] & 2147483647) << 1) | (b[2] >>> 31);
    b[2] = ((b[2] & 2147483647) << 1) | (b[3] >>> 31);
    b[3] = ((b[3] & 2147483647) << 1)
}
;
CMAC.const_Rb = 135;
CMAC.compute = function(a, d) {
    var f = [0, 0, 0, 0];
    var b = a.encrypt(f);
    var c = b[0];
    CMAC.leftShift(b);
    if (CMAC.MSBnotZero(c)) {
        b[3] ^= CMAC.const_Rb
    }
    var e = 0;
    while (e < d.length) {
        f[(e >> 2) & 3] ^= (d.charCodeAt(e) & 255) << (8 * (3 - (e & 3)));
        ++e;
        if ((e & 15) == 0 && e < d.length) {
            f = a.encrypt(f)
        }
    }
    if (e == 0 || (e & 15) != 0) {
        c = b[0];
        CMAC.leftShift(b);
        if (CMAC.MSBnotZero(c)) {
            b[3] ^= CMAC.const_Rb
        }
        f[(e >> 2) & 3] ^= 128 << (8 * (3 - (e & 3)))
    }
    f[0] ^= b[0];
    f[1] ^= b[1];
    f[2] ^= b[2];
    f[3] ^= b[3];
    return a.encrypt(f)
}
;
function CMAC_AES128(b, a) {
    return CMAC.compute(AES.HexToKey(b), a)
}
var FFX = {};
FFX.alphabet = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
FFX.precompF = function(a, h, g, e) {
    var d = 4;
    var f = new Array(d);
    var c = g.length;
    var b = 10;
    f[0] = 16908544 | ((e >> 16) & 255);
    f[1] = (((e >> 8) & 255) << 24) | ((e & 255) << 16) | (b << 8) | (Math.floor(h / 2) & 255);
    f[2] = h;
    f[3] = c;
    return a.encrypt(f)
}
;
FFX.precompb = function(c, g) {
    var e = Math.ceil(g / 2);
    var a = 0;
    var d = 1;
    while (e > 0) {
        d = d * c;
        --e;
        if (d >= 256) {
            d = d / 256;
            ++a
        }
    }
    if (d > 1) {
        ++a
    }
    return a
}
;
FFX.bnMultiply = function(b, d, g) {
    var c;
    var e = 0;
    for (c = b.length - 1; c >= 0; --c) {
        var f = b[c] * g + e;
        b[c] = f % d;
        e = (f - b[c]) / d
    }
}
;
FFX.bnAdd = function(b, d, g) {
    var c = b.length - 1;
    var e = g;
    while (c >= 0 && e > 0) {
        var f = b[c] + e;
        b[c] = f % d;
        e = (f - b[c]) / d;
        --c
    }
}
;
FFX.convertRadix = function(f, g, e, d, h) {
    var a = new Array(d);
    var c;
    for (c = 0; c < d; ++c) {
        a[c] = 0
    }
    for (var b = 0; b < g; ++b) {
        FFX.bnMultiply(a, h, e);
        FFX.bnAdd(a, h, f[b])
    }
    return a
}
;
FFX.cbcmacq = function(e, f, b, a) {
    var d = 4;
    var h = new Array(d);
    for (var c = 0; c < d; ++c) {
        h[c] = e[c]
    }
    var g = 0;
    while (4 * g < b) {
        for (var c = 0; c < d; ++c) {
            h[c] = h[c] ^ ((f[4 * (g + c)] << 24) | (f[4 * (g + c) + 1] << 16) | (f[4 * (g + c) + 2] << 8) | f[4 * (g + c) + 3])
        }
        h = a.encrypt(h);
        g = g + d
    }
    return h
}
;
FFX.F = function(c, u, w, o, g, x, a, l, v) {
    var m = 16;
    var t = Math.ceil(v / 4) + 1;
    var p = (w.length + v + 1) & 15;
    if (p > 0) {
        p = 16 - p
    }
    var k = new Array(w.length + p + v + 1);
    var s;
    for (s = 0; s < w.length; s++) {
        k[s] = w.charCodeAt(s)
    }
    for (; s < p + w.length; s++) {
        k[s] = 0
    }
    k[k.length - v - 1] = u;
    var h = FFX.convertRadix(o, g, l, v, 256);
    for (var q = 0; q < v; q++) {
        k[k.length - v + q] = h[q]
    }
    var e = FFX.cbcmacq(a, k, k.length, c);
    var n = e;
    var r;
    var f = new Array(2 * t);
    for (s = 0; s < t; ++s) {
        if (s > 0 && (s & 3) == 0) {
            r = s >> 2;
            n = c.encrypt([e[0], e[1], e[2], e[3] ^ r])
        }
        f[2 * s] = n[s & 3] >>> 16;
        f[2 * s + 1] = n[s & 3] & 65535
    }
    return FFX.convertRadix(f, 2 * t, 65536, x, l)
}
;
FFX.DigitToVal = function(c, a, e) {
    var f = new Array(a);
    if (e == 256) {
        for (var b = 0; b < a; b++) {
            f[b] = c.charCodeAt(b)
        }
        return f
    }
    for (var d = 0; d < a; d++) {
        var g = parseInt(c.charAt(d), e);
        if ((g == NaN) || !(g < e)) {
            return ""
        }
        f[d] = g
    }
    return f
}
;
FFX.ValToDigit = function(d, c) {
    var a = "";
    var b;
    if (c == 256) {
        for (b = 0; b < d.length; b++) {
            a += String.fromCharCode(d[b])
        }
    } else {
        for (b = 0; b < d.length; b++) {
            a += FFX.alphabet[d[b]]
        }
    }
    return a
}
;
FFX.encryptWithCipher = function(d, m, p, s) {
    console.log('Input to encryptWithCipher:', d);  // Log input to the function
    var f = d.length;
    var g = Math.floor(f / 2);
    console.log('Splitting input at position:', g);  // Log where the input is split

    var t = FFX.precompF(p, f, m, s);
    var q = FFX.precompb(s, f);
    var e = FFX.DigitToVal(d, g, s);
    var c = FFX.DigitToVal(d.substr(g), (f - g), s);

    console.log('First half of input (e):', e);  // Log the first half
    console.log('Second half of input (c):', c);  // Log the second half

    if ((e == "") || (c == "")) {
        return ""
    }

    for (var k = 0; k < 5; k++) {
        // Additional logging for each round
        console.log('Round:', k);

        var u = FFX.F(p, k * 2, m, c, c.length, e.length, t, s, q);
        var v = 0;
        for (var h = e.length - 1; h >= 0; --h) {
            var o = e[h] + u[h] + v;
            if (o < s) {
                e[h] = o;
                v = 0;
            } else {
                e[h] = o - s;
                v = 1;
            }
        }
        var u = FFX.F(p, (k * 2) + 1, m, e, e.length, c.length, t, s, q);
        v = 0;
        for (var h = c.length - 1; h >= 0; --h) {
            var o = c[h] + u[h] + v;
            if (o < s) {
                c[h] = o;
                v = 0;
            } else {
                c[h] = o - s;
                v = 1;
            }
        }
    }

    console.log('Final result:', e, c);  // Log final encrypted halves
    return FFX.ValToDigit(e, s) + FFX.ValToDigit(c, s);
}

;
FFX.encrypt = function(d, e, b, c) {
    var a = AES.HexToKey(b);
    if (a == null) {
        return ""
    }
    return FFX.encryptWithCipher(d, e, a, c)
}
;
module.exports = {
    encryptAccountNumber: function(accountNumber) {
      var encryptedAccountNumber = ProtectString(accountNumber)[0];
      return encryptedAccountNumber;
    },
    decryptAccountNumber: function(encryptedAccountNumber) {
      var decryptedAccountNumber = ProtectString(encryptedAccountNumber)[0];
      return decryptedAccountNumber;
    }
  };
