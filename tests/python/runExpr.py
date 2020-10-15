# -*- coding: utf-8 -*-

from booleanExpressionEvaluator import BooleanExpressionEvaluator
import sys
import traceback


def uprint(*objects, sep=' ', end='\n', file=sys.stdout):
    enc = file.encoding
    if enc == 'UTF-8':
        print(*objects, sep=sep, end=end, file=file)
    else:
        def f(obj): return str(obj).encode(
            enc, errors='backslashreplace').decode(enc)
        print(*map(f, objects), sep=sep, end=end, file=file)


def run_test():
    try:
        bexpr = BooleanExpressionEvaluator()
        res = bexpr.convert_to_dnf(sys.argv[1])
        uprint(res)
        sys.stdout.flush()
    except Exception as e:
        uprint('an error happened ' + str(e) + ' ' + traceback.extract_stack())
        sys.stderr.flush()


run_test()
