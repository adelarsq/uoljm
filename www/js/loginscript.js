if (!isUserLogged()) {
    var user = 'usuario';
    var pass = 'senha';
 
    document.getElementById('user').value = user;
    document.getElementById('pass').value = pass;
 
    document.getElementsByClassName('submit-login-input')[0].click();
} else {
    console.log("Usuário já está logado.");
}
 
function isUserLogged() {
    return document.getElementsByClassName('top-user')[0];
}