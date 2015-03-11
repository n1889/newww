var pick = require("lodash").pick;

module.exports = function(request, reply) {
  var package
  var context = {}
  var user = request.auth.credentials
  var Collaborator = require("../models/collaborator").new(request)
  var Package = require("../models/package").new(request)
  var desiredPackageFields = [
    "name",
    "description",
    "scoped",
    "private"
  ];

  Package.get(request.packageName)
  .then(function(pkg){
    package = pick(pkg, desiredPackageFields);
    return Collaborator.list(package.name)
  })
  .then(function(collaborators) {
    package.collaborators = collaborators;

    if (user && user.name in package.collaborators) {
      user.hasReadAccessToPackage = true
      user.hasWriteAccessToPackage = package.collaborators[user.name].write
    }

    if (package.private && (!user || !user.hasReadAccessToPackage)) {
      return reply.view('errors/not-found').code(404);
    }

    context.enablePermissionTogglers = package.scoped
      && user
      && user.hasWriteAccessToPackage

    context.package = package
    return reply.view('package/access', context)
  })

};