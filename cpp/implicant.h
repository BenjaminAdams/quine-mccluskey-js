#ifndef LIBIMPLICANT_H
#define LIBIMPLICANT_H

#include <string>
#include <vector>
#include <set>

class Implicant {
  
private:

    std::string implicant_str;
    std::set<int> coverage;
    void init(const std::string& other, const std::set<int>& covr = {});
    void generateCoverage();

public:

    Implicant(const std::string& other, const std::set<int>& covr = {});
    Implicant(const char *other_str, const std::set<int>& covr = {});
    Implicant& operator=(const  std::string& other);
    Implicant& operator=(const Implicant& other);
    Implicant operator+(const Implicant& other);
    bool operator==(const Implicant& other) const;
    bool operator!=(const Implicant& other) const;
    bool operator<(const Implicant& other) const;
    std::string getStr() const;
    std::string getStrCoverage() const;
    int getOneCount() const;
    std::set<int> getCoverage() const;
    std::vector<Implicant> getExplodedList(int pos = 0, std::string step = "");

};

std::ostream &operator<<(std::ostream &os, const Implicant& other);

#endif //LIBIMPLICANT_H