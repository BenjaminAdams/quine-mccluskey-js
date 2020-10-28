

#ifndef LIBQM_H
#define LIBQM_H

#include "qm.h"
#include "implicant.h"

#include <vector>

struct stepResult {
    std::vector<Implicant> reduced;
    std::vector<Implicant> excluded;
};

stepResult makeQMStep(std::vector<Implicant> implicantList);
std::vector<Implicant> makeQM(const std::vector<Implicant>& implicantList, const std::vector<Implicant>& dontCareList);
std::string getBooleanExpression(std::vector<Implicant> solution);

#endif // LIBQM_H
