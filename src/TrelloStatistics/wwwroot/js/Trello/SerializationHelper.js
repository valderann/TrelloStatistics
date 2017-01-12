var Scripts;
(function (Scripts) {
    var Components;
    (function (Components) {
        var SerializationHelper = (function () {
            function SerializationHelper() {
            }
            SerializationHelper.toInstance = function (obj, json) {
                var jsonObj = JSON.parse(json);
                if (typeof obj["fromJSON"] === "function") {
                    obj["fromJSON"](jsonObj);
                }
                else {
                    for (var propName in jsonObj) {
                        obj[propName] = jsonObj[propName];
                    }
                }
                return obj;
            };
            return SerializationHelper;
        }());
        Components.SerializationHelper = SerializationHelper;
    })(Components = Scripts.Components || (Scripts.Components = {}));
})(Scripts || (Scripts = {}));
