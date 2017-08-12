var x;
var test = !!(Math.random() % 2);
test && (x = 1);
// ^-- Error (no-unused-expression)
if (test)
    console.log(x);
if (test) {
    console.log(1);
}
console.log(2);
if (test)
    console.log(3);
// false, true;
var a;
console.log(a = 1);
testFn(7);
function testFn(test2) {
    console.log(test2);
}
test ? !console.log(1) || (x = 7) : console.log(2);
//# sourceMappingURL=t.js.map