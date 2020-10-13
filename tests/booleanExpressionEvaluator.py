from pyeda.inter import *
import traceback

"""
Makes the expressions input operable upon by pyeda.
"""

"""
All operands and parentheses 
"""
_booleanOperands = [" and ", " or ", "(", ")"]

_operandSubstitution = {
    "and": "&",
    "or": "|"
}


class BooleanExpressionEvaluator:

    def __init__(self):
        self.variableSubstitution = {}

    def generate_variable_name(self):
        return "v{}".format(len(self.variableSubstitution))


    def prep(self, expression):
        prep_exp = expression
        splits = [expression]
        for booleanOperand in _booleanOperands:
            local_splits = []
            for split in splits:
                local_splits.extend(split.split(booleanOperand))
            splits = local_splits

        for split in splits:
            split = split.strip()
            if split != "":
                variable_name = self.generate_variable_name()
                self.variableSubstitution.update({variable_name: split})
                prep_exp = prep_exp.replace(split, variable_name)

        for key, value in _operandSubstitution.items():
            prep_exp = prep_exp.replace(key, value)

        return prep_exp

    def convert_to_string(self, individual_expression, variable_substitution):
        individual_expression_str = "{}".format(individual_expression)
        for key, value in variable_substitution.items():
            individual_expression_str = individual_expression_str.replace(key, value)
        return individual_expression_str

    def convert_to_dnf(self, expression):
        """
        takes an expression statement in string and translates to disjunctive normal form, also known as
        or major form
        :param expression: boolean nested expressions
        :return: {
                    'expressions'  --> expressions in Or major form
                    'variable_substitu'
        """
        prep_exp = self.prep(expression)
        dnf_exp = {}
        try:
            dnf_exp = expr(prep_exp).to_dnf()
        except Exception :
            traceback.print_exc()
        expressions = []

        if dnf_exp.ASTOP == 'and' or dnf_exp.depth <= 1:
            expressions.append(self.convert_to_string(dnf_exp, self.variableSubstitution))
        else:
            for expression_dnf in dnf_exp.xs:
                expressions.append(self.convert_to_string(expression_dnf, self.variableSubstitution))

        # dnf = "{}".format(e.to_dnf())
        # for key, value in variableSubstitution.items():
        #    dnf = dnf.replace(key, value)
        return expressions
