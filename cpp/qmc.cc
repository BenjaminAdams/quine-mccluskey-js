// qmc.cc
#include <node.h>
#include <string>
#include <vector>
#include "implicant.h"
#include "qm.h"

namespace QuineMcCluskey {

using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

void Method(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    Implicant singleImplicant = "0101";

    std::vector<Implicant> listOfImplicants = {
        "0001",
        "1001",
        "1011",
        "1100",
        "1101",
        "1110",
        "1111"
    };

    std::vector<Implicant> solution = makeQM(listOfImplicants, {});

    // Get the boolean expression
    std::string expression = getBooleanExpression(solution);

    //args.GetReturnValue().Set(String::NewFromUtf8(isolate, "world").ToLocalChecked());
    args.GetReturnValue().Set(String::NewFromUtf8(isolate, expression.c_str()).ToLocalChecked());
}

void Initialize(Local<Object> exports) {
  NODE_SET_METHOD(exports, "getBooleanExpression", Method);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)

}  