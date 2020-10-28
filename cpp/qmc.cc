#include <nan.h>
#include <node.h>
#include <node_buffer.h>
#include <string>
#include <vector>
#include "implicant.h"
#include "qm.h"

using namespace std;
using namespace v8;

void GetBooleanExpression(const Nan::FunctionCallbackInfo<v8::Value> &info)
{
    v8::Local<v8::Context> context = info.GetIsolate()->GetCurrentContext();

    //double arg0 = info[0]->NumberValue(context).FromJust();

    // Local<Float32Array> myarr = info[0].As<Float32Array>();
    // Nan::TypedArrayContents<float> dest(myarr);
    // std::string firstElement = (*myarr)[0];
    //v8::String::Utf8Value strxx(info[0]->ToString());
    //
    // Array aaaa = info[0].As<Array>;
    char *buf = node::Buffer::Data(info[0]);

    int arr[] = {10, 20, 30};
    int n = sizeof(arr) / sizeof(arr[0]);
    vector<int> vect(arr, arr + n);

    Implicant singleImplicant = "0101";

    std::vector<Implicant> listOfImplicants = {
        "0001",
        "1001",
        "1011",
        "1100",
        "1101",
        "1110",
        "1111"};

    // std::vector<Implicant> listOfImplicants = {
    //     "0001",
    //     "1001",
    //     "1011",
    //     "1100",
    //     "1101",
    //     "1110",
    //     "1111"
    // };

    std::vector<Implicant> solution = makeQM(listOfImplicants, {});

    // Get the boolean expression
    std::string expression = getBooleanExpression(solution);
    // expression = expression.append(strxx);
    info.GetReturnValue().Set(Nan::New(expression).ToLocalChecked());
}

void Init(v8::Local<v8::Object> exports)
{
    v8::Local<v8::Context> context = exports->CreationContext();

    exports->Set(context,
                 Nan::New("getBooleanExpression").ToLocalChecked(),
                 Nan::New<v8::FunctionTemplate>(GetBooleanExpression)
                     ->GetFunction(context)
                     .ToLocalChecked());
}

NODE_MODULE(GetBooleanExpression, Init)

// // qmc.cc
// #include <node_api.h>
//

// namespace QuineMcCluskey {

// using v8::Exception;
// using v8::FunctionCallbackInfo;
// using v8::Isolate;
// using v8::Local;
// using v8::Number;
// using v8::Object;
// using v8::String;
// using v8::Value;

// void Method(const FunctionCallbackInfo<Value>& args) {
//     Isolate* isolate = args.GetIsolate();

//     double value = args[0].As<Number>()->Value();

//    // std::string value = args[0].As<String>()->Value();

//     Implicant singleImplicant = "0101";

//     std::vector<Implicant> listOfImplicants = {
//         "0001",
//         "1001",
//         "1011",
//         "1100",
//         "1101",
//         "1110",
//         "1111"
//     };

//     // std::vector<Implicant> listOfImplicants = {
//     //     "0001",
//     //     "1001",
//     //     "1011",
//     //     "1100",
//     //     "1101",
//     //     "1110",
//     //     "1111"
//     // };

//     std::vector<Implicant> solution = makeQM(listOfImplicants, {});

//     // Get the boolean expression
//     std::string expression = getBooleanExpression(solution);
//     expression= expression.append(std::to_string(value));
//     //args.GetReturnValue().Set(String::NewFromUtf8(isolate, "world").ToLocalChecked());
//     args.GetReturnValue().Set(String::NewFromUtf8(isolate, expression.c_str()).ToLocalChecked());
// }

// void Initialize(Local<Object> exports) {
//   NODE_SET_METHOD(exports, "getBooleanExpression", Method);
// }

// NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)

// }