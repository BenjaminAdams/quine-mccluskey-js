# boolean-expression-tree-evaluator

https://github.com/IvanRave/logic-tree
http://booleanbot.com/  uses this syntax a+(b'(c+d))
https://www.mathematik.uni-marburg.de/~thormae/lectures/ti1/code/normalform/index.html
Quine-McCluskey
https://www.dcode.fr/boolean-expressions-calculator  //pretty good

1 - split by OR, AND, (, ) -> get array of values					
2 - trim all values in the array					
3 - Build dictionary by expression (no duplicates)					{'component.id==abc': 'A', 'component.id⊃⊃def': 'B'…}
4 - Replace original strings with variables using dict 3					string.replace
5 - Replace operators: 			or->||, and->&&		
6 - WORKING FORMULA: 			A || (B && (C || D))		
					
n - Replace relations operators for negation:					`== -> !=
					!= -> ==
					⊃⊃ -> !⊃
					!⊃ -> ⊃⊃
