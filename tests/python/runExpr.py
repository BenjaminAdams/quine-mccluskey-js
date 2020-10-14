from booleanExpressionEvaluator import BooleanExpressionEvaluator
import sys


def run_test():
    try:
        bexpr = BooleanExpressionEvaluator()
        res = bexpr.convert_to_dnf(sys.argv[1])
        print(res)
        sys.stdout.flush()
    except Exception:
        #print('an error happened')
        sys.stderr.flush()


run_test()
