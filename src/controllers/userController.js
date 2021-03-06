const userQueries = require("../db/queries.users.js");
const wikiQueries = require("../db/queries.wikis.js");
const passport = require("passport");
const keySecret = process.env.SECRET_KEY;
const keyPublishable = process.env.PUBLISHABLE_KEY;
var stripe = require("stripe")(keySecret);

module.exports = {

  signUp(req, res, next){
    res.render("users/sign_up");
  },

  create(req, res, next){
    let newUser = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirmation: req.body.passwordConfirmation
    };
    userQueries.createUser(newUser, (err, user) => {
      if(err){
        req.flash("error", err);
        res.redirect("/users/sign_up");
      } else {
        passport.authenticate("local")(req, res, () => {
          req.flash("notice", "You've successfully signed in!");
          res.redirect("/");
        })
      }
    });
  },

  signInForm(req, res, next){
     res.render("users/sign_in");
  },

  signIn(req, res, next){
     passport.authenticate("local", (err, user, info) => {
       if (err) { return next(err); }
       if(!user){
         req.flash("notice", "Sign in failed. Please try again.")
         res.redirect("/users/sign_in");
       } req.logIn(user, function(err) {
          if (err) { return next(err); }
           req.flash("notice", "You've successfully signed in!");
           res.redirect("/");
         });
     })(req, res, next);
  },

  signOut(req, res, next){
     req.logout();
     req.flash("notice", "You've successfully signed out!");
     res.redirect("/");
  },

  upgrade(req, res, next){
    res.render("users/upgrade", {keyPublishable});
  },

  payment(req, res, next){
    let amount = 1500;
    stripe.customers.create({
      email: req.body.stripeEmail,
      source: req.body.stripeToken
    })
    .then((customer) => {
      stripe.charges.create({
        amount,
        description: "Premium Membership",
        currency: "usd",
        customer: customer.id
      })
    })
    .then((charge) => {
      userQueries.upgrade(req.user.id);
      res.render("users/success");
    });
  },

  downgradeWarning(req, res, next){
    res.render("users/downgrade");
  },

  downgrade(req, res, next){
    userQueries.downgrade(req.user.id);
    wikiQueries.makePublic(req.user.id);
    req.flash("notice", "You have successfully downgraded");
    res.redirect("/");
  },

  showCollaborations(req, res, next){
    userQueries.getUser(req.user.id, (err, result) => {
      user = result["user"];
      collaborations = result["collaborations"];
      if(err || user == null){
        res.redirect(404, "/");
      } else {
        console.log("collaborations :" + collaborations);
        res.render("users/collaborations", {user, collaborations});
      }
    });
  }

}
