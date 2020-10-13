from booleanExpressionEvaluator import BooleanExpressionEvaluator
import sys


def run_test():
    bexpr = BooleanExpressionEvaluator()
    res = bexpr.convert_to_dnf(sys.argv[1])
    print(res)
    sys.stdout.flush()


run_test()
