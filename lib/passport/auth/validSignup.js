/**
 * Valid user signup data
 *
 * @param  {Object} user
 * @param  {String} confirmPassword
 * @param  {String} confirmEmail
 * @param  {Object} req
 * @param  {Object} res
 * @return {Boolean}
 */
module.exports = function validSignup(user, confirmPassword, confirmEmail, req, res){

  if (!user.email) {
    res.addMessage('error', 'auth.register.email.required', {
      type: 'validation',
      field: 'email',
      rule: 'required'
    });
    return false;
  }

  if (!confirmEmail) {
    res.addMessage('error', 'auth.register.confirmEmail.required', {
      type: 'validation',
      field: 'confirmEmail',
      rule: 'required'
    });
    return false;
  }

  // check if password exist
  if (!user.password) {
    res.addMessage('error', 'auth.register.password.required', {
      type: 'validation',
      field: 'password',
      rule: 'required'
    });
    return false;
  }

  if (!confirmPassword) {
    res.addMessage('error', 'auth.register.confirmPassword.required', {
      type: 'validation',
      field: 'password',
      rule: 'required'
    });
    return false;
  }

  if (confirmPassword !== user.password) {
    res.addMessage('error', 'auth.confirmPassword.and.newPassword.diferent', {
      type: 'validation',
      field: 'password',
      rule: 'diferent'
    });
    return false;
  }

  if (confirmEmail !== user.email) {
    res.addMessage('error', 'auth.email.and.confirmEmail.diferent', {
      type: 'validation',
      field: 'email',
      rule: 'diferent'
    });
    return false;
  }

  return true;
}
