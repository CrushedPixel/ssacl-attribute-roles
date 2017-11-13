"use strict";

var Sequelize = require('sequelize')
  , init;

function getValue(target, key, value, options) {
  var attr = target.rawAttributes[key];
  var assoc = target.associations[key];

  if (attr) {
    // apply attribute roles
    if (!attr.roles || (attr.roles[options.role] && attr.roles[options.role].get)) {
      return value;
    } else {
      return undefined;
    }
  } else if (assoc) {
    // apply association roles
    if (!assoc.options.roles || (assoc.options.roles[options.role] && assoc.options.roles[options.role].get)) {
      return value;
    } else {
      return undefined;
    }
  } else if (value instanceof Sequelize.Model) {
    return value.get.call(value, options);
  } else {
    return value;
  }
}

init = function(target) {
  if (target.prototype instanceof Sequelize.Model) {
    var $get = target.prototype.get;

    Object.keys(target.rawAttributes).forEach(function (attr) {
      if (target.rawAttributes[attr].roles !== undefined) {
        if (target.rawAttributes[attr].roles === false) {
          target.rawAttributes[attr].roles = {};
          return;
        }

        Object.keys(target.rawAttributes[attr].roles).forEach(function (role) {
          if (typeof target.rawAttributes[attr].roles[role] === "boolean") {
            target.rawAttributes[attr].roles[role] = {
              set: target.rawAttributes[attr].roles[role],
              get: target.rawAttributes[attr].roles[role]
            };
            return;
          }

          if (target.rawAttributes[attr].roles[role].set === undefined) {
            target.rawAttributes[attr].roles[role].set = false;
          }
          if (target.rawAttributes[attr].roles[role].get === undefined) {
            target.rawAttributes[attr].roles[role].get = false;
          }
        });
      }
    });

    target.prototype.get = function(key, options) {
      if (typeof key === "object" && !options) {
        options = key;
        key = undefined;
      }

      if (options === undefined) {
        options = {};
      }

      if (options.raw === true) {
        return $get.call(this, key, options);
      }

      if (key !== undefined) {
        return getValue(target, key, $get.call(this, key, options), options);
      }

      var values = $get.call(this, options)
        , response = {};

      Object.keys(values).forEach(function (key) {
        response[key] = getValue(target, key, values[key], options);
      });

      return response;
    };
  } else {
    target.afterDefine(function (Model) {
      init(Model);
    });
  }
};

module.exports = init;
