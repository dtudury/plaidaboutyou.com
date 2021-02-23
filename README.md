# plaidaboutyou.com

I didn't start this project because I thought weaving was cool. But I do now. If you're new to weaving, watch [this video about weaving](https://www.thestrangeloop.com/2018/its-just-matrix-multiplication-notation-for-weaving.html). Weaving is awesome!

## What is PlaidAboutYou?

PlaidAboutYou is a virtual loom. It renders fabrics defined using a weaving draft metaphor, webGL, and a custom pattern describing language.
* The weaving draft metaphor is used because it's powerful but still fun.
* webGL allows the fabric to be textured at the thread level. Currently it's only used to provide a subtle gradient on the threads but more is certainly possible
* The pattern describing language handles named patterns, repetitions, offsets, reversals, and subpatterns.

## the language

* **named patterns**: the `VARS=` sections is a dictionary of patterns and values. `RED:0xff0000` stores the color red. `STRAIGHT:[1,2,3,4]` stores a straight draw pattern
* **repetitions**: patterns can be repeated. `RED*20` is 20 red threads next to each other. `[1,2,3,4]*2` outputs `[1,2,3,4,1,2,3,4]`
* **reversals**: patterns can be reversed. `-[1,2,3,4]` outputs `[4,3,2,1]`
* **offsets**: patterns can be offset. Offsets are applied *after* the pattern is output. `[1,2,3]+10` outputs `[1,2,3]`. `[1,2,3]+10*2` outputs `[1,2,3,11,12,13]`. Reversed offsets are subtracted instead of added. if `N` is set as `1+1` (a value that starts at 1 and increases by 1 each time it's called) then `[N*3,-N*3]` outputs ` [1,2,3,4,3,2]`. If you're into postfix increment operators it's the same output as `[N++, N++, N++, N--, N--, N--]`
* **subpatterns**: `[[1,2]+10*2]+100*2` outputs `[1,2,11,12,121,122,131,132]`. This is because it's a parsed language (not because I'm imagining a use case)

## the tie-up

The tie-up is a comma separated list of binary numbers. 
* The leftmost digit of the first number is whether the top left corner is on or off.
* The rightmost digit of the first number is the top right.
* The leftmost digit of the last number is the bottom left.
* The rightmost digit of the last number is the bottom right.

## a whole URL

A Burberry-like plaid: <https://plaidaboutyou.com/#VARS=A:0x000000;B:0xffffff;C:0xaa7733;D:0xdd0000;S:[A*3,B*6,A*6,C*21,D];P:[S,-S]___WARP=P___WEFT=P___THREADING=[1,2,3,4]___TREADLING=[1,2,3,4]___TIE-UP=0b1100;0b110;0b11;0b1001___CONSTANTS=treadles:4;shafts:4;scale:3>

* `https://plaidaboutyou.com/#`
* `VARS=`
* `A:0x000000;B:0xffffff;C:0xaa7733;D:0xdd0000;` 4 colors
* `S:[A*3,B*6,A*6,C*21,D];` stripes of varios widths
* `P:[S,-S]___` same stripes forwards and backwards
* `WARP=P___WEFT=P___` same stripes in both axes
* `THREADING=[1,2,3,4]___TREADLING=[1,2,3,4]___` straight draw
* `TIE-UP=0b1100;0b0110;0b0011;0b1001___` 2/2 twill
* `CONSTANTS=treadles:4;shafts:4;scale:3`


## features to add

* handle much longer patterns (right now pattern length is max 128 which isn't very much for some patterns)
* 3d string textures: I'm using 3d rendering but only to do very light shading to imply direction
* physical modeling: what happens when you have a bunch of floats next to each other on real fabric? can we predict that behavior?
