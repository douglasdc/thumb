"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var os_1 = require("os");
var fs_1 = require("fs");
var child_process_1 = require("child_process");
var FfmpegBuilder = /** @class */ (function () {
    function FfmpegBuilder(input, scale, crop) {
        this.input = input;
        this.crop = crop;
        this.scale = scale;
    }
    FfmpegBuilder.prototype.script = function () {
        var args = ["-i"];
        if (typeof this.input === "string") {
            args.push(this.input);
        }
        else {
            args.push("-");
        }
        args.push("-frames:v", "1", "-q:v", "0", "-vf");
        var process = "scale=w='if(gte(ih, iw), ".concat(this.scale, ", -1)':h='if(gte(iw, ih), ").concat(this.scale, ", -1)'");
        if (this.crop) {
            process += ",crop=".concat(this.crop, ":").concat(this.crop);
        }
        args.push(process, "-f", "image2", "pipe:1");
        return args;
    };
    FfmpegBuilder.prototype.run = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var a = (0, child_process_1.spawn)("ffmpeg", _this.script(), { cwd: os_1.default.tmpdir() });
            var buffer = [];
            var bufferError = [];
            a.stdout.on("data", function (data) {
                buffer.push(data);
            });
            a.stderr.on("data", function (err) {
                bufferError.push(err);
            });
            a.on("exit", function (code) {
                if (code !== 0) {
                    reject(Buffer.concat(bufferError).toString().trim());
                }
                else {
                    resolve(Buffer.concat(buffer));
                }
            });
            if (_this.input instanceof Uint8Array) {
                a.stdin.write(_this.input);
                a.stdin.end();
            }
        });
    };
    return FfmpegBuilder;
}());
console.time("RUN TIME");
function scale(input, size) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                    var script, output, e_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 2, , 3]);
                                script = new FfmpegBuilder(input, size);
                                return [4 /*yield*/, script.run()];
                            case 1:
                                output = _a.sent();
                                fs_1.default.writeFileSync("".concat(process.cwd(), "/thumb_").concat(size, "_").concat(size, ".jpg"), output);
                                resolve(null);
                                return [3 /*break*/, 3];
                            case 2:
                                e_1 = _a.sent();
                                reject(e_1);
                                return [3 /*break*/, 3];
                            case 3: return [2 /*return*/];
                        }
                    });
                }); })];
        });
    });
}
function makeThumbs(buffer, sizes) {
    return __awaiter(this, void 0, void 0, function () {
        var jobs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jobs = [];
                    sizes.forEach(function (size) {
                        jobs.push(scale(buffer, size));
                    });
                    return [4 /*yield*/, Promise.all(jobs)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
try {
    console.time("128");
    var script128 = new FfmpegBuilder("https://pbs.twimg.com/media/F9JlP3bbQAAvCf7?format=jpg", 128, 128);
    console.log(process.cwd());
    var buffer128 = await script128.run();
    console.timeEnd("128");
    await makeThumbs(buffer128, [64, 32]);
    fs_1.default.writeFileSync("".concat(process.cwd(), "/thumb_128_128.jpg"), buffer128);
}
catch (e) {
    console.log(e);
}
console.timeEnd("RUN TIME");
