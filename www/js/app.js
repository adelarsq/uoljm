/*
 * Fórum UOL Jogos Mobile - Híbrido! Porque no Javascript não há limites.
 * Só uma documentadinha de leve... :-)
 *
 * Explicação geral:
 * Olha, esse aplicativo é uma verdadeira gambiarra. Um workaround.
 * Como a UOL só provê uma API de login pro pagseguro, vamos ter que pegar alguém pra logar pra gente.
 * Esse "alguém" vai ser um navegador fantasma. Um bot.
 * Então são duas Webviews pro aplicativo: um para o cordova e outro para o bot.
 * Nossa aplicação vai injetar scripts nesse bot pra fazer tarefas que um usuário comum faria:
 * Logar, postar (tópico ou resposta), avaliar um tópico com estrelas, negativar, positivar, mandar MP, etc.
 * Para isso temos as funções do nosso querido DWR (Direct Web Remote), no código fonte HTML do fórum.
 * Felizmente, o Dalton reuniu todas as funções de usuário em um só objeto. Em Javascript. E deixou em público.
 * Isso vai facilitar as injeções de script. Scripts menores para funções simples.
 * Para cada injeção de script, o bot vai sofrer um redirecionamento na página. Para cada redirecionamento,
 * precisarei passar funções para tratar eventos de 'loadstop', obtendo assim a resposta de cada requisição.
 * Não vou me aprofundar tanto. Isso é só um overview.
 *
 * Para tratar o bug do deslog, vai ser outra gambiarra também...
 * Toda vez que o usuário entrar no aplicativo, o app deve verificar se ele já logou, acessando o localStorage.
 * Se sim, ele vai pegar os dados de login armazenados no localStorage e logar automaticamente.
 * Estando o usuário logado, o aplicativo deve logar a cada cinco minutos para o usuário...
 * Isso vai acontecer até o usuário decidir deslogar manualmente, por meio de uma tela chamada 'login'.
 *
 * That's all, folks.
 *
 * Seção logo abaixo: variáveis globais, declaradas no objeto window.
 *
 */


// <--- Variáveis globais. --->

  // -> Subseção: navegação.
window.forumURL = 'http://forum.jogos.uol.com.br/';   // Para desenvolvimento mobile, caso queiro rodar no seu celular.
                                                      // Também conhecido como 'modo produção';
                                                      //
window.forumURL = '/forum/';                          // Para testes no navegador via proxy; comente e descomente somente aqui.
                                                      // Também conhecido como 'modo desenvolvimento';
                                                      //
window.IdF = 57;                                      // Variávelzinha pra redirecionar pra alguma seção do fórum.
                                                      // Apenas para debug.

  // -> Subseção: Tratamento de eventos.
  //
  // loginHandler é uma função que será executada caso o usuário decida logar.
  // Em caso de sucesso, o aplicativo vai gravar o usuário e senha até ele deslogar.
  // Não interessa se ele sair do app. Toda vez que ele entrar, ele deve logar automaticamente.
  // E, ainda, logará de tempo em tempo, de forma automatizada, para evitar o deslog.
  // Em caso de falha, deve aparecer uma popup avisando que ocorreu algum erro....

window.loginHandler = function(event){
  console.log(event.url);
  if(event.url.indexOf('sac')===-1){ // Se redirecionar para o SAC do UOL, é porque logou.
    //Usuário ou senha incorreta.
  } else {
    localStorage.setItem('user',user);
    localStorage.setItem('pass',pass);
    localStorage.setItem('isLogged','1');
    $rootScope.asyncTask = false;
  }
  $rootScope.isLogged = true;
  logBrowser.removeEventListener('loadstop',window.loginHandler);
}

    // postMsgHandler é uma função que será executada caso o usuário poste algo
    // esse algo pode ser um post normal (resposta a um tópico) ou um tópico
    // deverá injetar um script no nosso navegador fantasma
    // e depois adicionar outro handler para informar se houve sucesso ou falha....

window.postMsgHandler = function(content,mode){
  if(mode=='topico')
    logBrowser.executeScript({code:'PostFunctions.insertPost("'+window.idF+','+content+'")'});
  else if(mode=='post')
    logBrowser.executeScript({code:'PostFunctions.insertTopic("'+content+'")'});
  logBrowser.removeEventListener('loadstop',window.postMsgHandler);
}


  // -> Subseção: Extração dos dados. Comunicação com o servidor do UOL.

    // XHR Object. Nosso elemento chave para a comunicação.
window.xhttp = new XMLHttpRequest;
    // Container para armazenar a resposta das XHR Requests. E manipulação de DOM, é claro.
window.forum = document.createElement('div');
    // Declaração do nosso navegador fantasma. Vamos injetar alguns scripts nele posteriormente.
window.logBrowser = window.open('https://acesso.uol.com.br','_blank','hidden=yes');

    // ***  Bônus: window.localStorage, que armazenará três informações:
    //      Usuário, senha e isLogged (que indica se o usuário está logado ou não).


// <--- Declaração do módulo Angular. --->

angular.module('ForumUOLJogos', ['ionic'])

// Script de inicialização. Toda vez que o aplicativo for inicializado, isso aqui vai executar...
.run(function($ionicPlatform,$rootScope,$interval,acessoUOL) {
  $ionicPlatform.ready(function() {

    // Definimos algumas variáveis do rootScope.
    // 'rootScope' seria o scope global do Angular.
    // Qualquer view pode acessar o rootScope.
    // Precisamos do rootScope para as views saberem se há algum processo assíncrono em andamento,
    // Ou se o usuário está logado para esconder ou mostrar alguns botões, por exemplo.
    // Nossos campos do rootScope:
    $rootScope.asyncTask = null;    //Indica se há algum async em andamento.
    $rootScope.isLogged = null;     //Indica se o usuário está logado.
    $rootScope.numberPages = null;  //Contém o número de páginas de um tópico...
                                    //Usado na transição da seção para o tópico.

    // Alguns handlers para detecção de teclado...
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    // Verifica se o usuário está logado. Se for o caso, automatizar o login de cinco em cinco minutos...
    if( !localStorage.getItem('isLogged') || localStorage.getItem('isLogged') == '0' )
      $rootScope.isLogged = false;
    else {
      $rootScope.isLogged = true;
      $interval(doLogin),5*60*1000);
    }

  });
})


// <--- Configuração: rotas do aplicativo. Cada view (ou tela) vai ter um controller, como de tradição. --->

.config(function($stateProvider,$urlRouterProvider){
	$stateProvider
		.state('sections', {
			url: '/',
			templateUrl: 'views/sections.html',
			controller: 'indexController'
		})
		.state('section',{
			url: '/:sec',
			templateUrl: 'views/section.html',
			controller: 'topicController'
		})
		.state('topic',{
			url: '/t/:topc',
			templateUrl: 'views/topic.html',
			controller: 'postsController'
		})
    .state('login',{
      url: '/l/login',
      templateUrl: 'views/login.html',
      controller: 'loginController'
    })
    .state('post',{
      url: '/p/post',
      templateUrl: 'views/post.html',
      controller: 'sendPostController'
    });
	$urlRouterProvider.otherwise('/');
})


// <--- Nosso serviço que injetará script no navegador fantasma para logar o usuário... --->

.service('acessoUOL',function($q){

  var log = function(user,pass){
    var d = $q.defer();
    $rootScope.asyncTask = true;
    user = user.trim();
    var loginscript = 'document.getElementsByTagName("input")[0].value = "'+user+'"; \
                      document.getElementsByTagName("input")[1].value = "'+pass+'"; \
                      document.getElementsByTagName("form")[0].submit(); \
                      undefined;';
    logBrowser.addEventListener('loaderror',function(event){
      def.resolve('Falha no envio de dados');
    });
    logBrowser.addEventListener('loadstop',window.loginHandler);
    logBrowser.executeScript({code:loginscript},function(){});
  }
  return {
    log: log
  }

})


// <--- Começam aqui os controllers para as views... --->

.controller('loginController',['$scope','$rootScope','$interval','acessoUOL',function($scope,$rootScope,$interval,acessoUOL){
  // Controller da tela de login...
  // Aqui o usuário vai logar, chamando o nosso serviço 'acessoUOL'.
  // Se o login for bem sucedido OU se o usuário já estiver logado, a tela de login
  // renderizará um 'painel de usuário', com o nome do usuário, as opções de deslogar e de ler as MPs.

  $rootScope.asyncTask = false;

  function showErrorMsg(err){
    $scope.stat = 'Erro ao logar no fórum. ('+err+')';
    $rootScope.asyncTask = false;
  };

  $scope.login = acessoUOL.log($scope.user,$scope.pass);

  $scope.logoff = function(){
    window.localStorage.setItem('isLogged','0');
    $rootScope.isLogged = false;
  }

}])

.controller('indexController',['$scope',function($scope){
  // inútil? Melhor deixar, caso precise num futuro próximo...
}])

.controller('topicController',['$rootScope','$scope','$state','$stateParams',function($rootScope,$scope,$state,$stateParams){
  // Controller da seção do fórum...
  // Nada de especial aqui. O usuário vai ver as informações:
  // Titulo da seção no header, titulos dos tópicos, autores e no. de respostas
  // Ao arrastar a lista pra baixo, ela vai atualizar sozinha.

	var relTopics = {
		"noticias":"56",
		"nintendo":"39",
		"pc":"40",
		"sony":"41",
		"ms":"43",
		"museu":"44",
		"vale_tudo":"57"
	};

  var section = "_f_" + relTopics[$stateParams.sec];

  // <-- Códigozinho para extrair e tratar dados dos tópicos... -->
  $scope.topicos = [];
  xhttpRequestHandle = function(){
		if(window.xhttp.readyState == 4 && window.xhttp.status == 200){
			window.forum.innerHTML = window.xhttp.responseText;
      $scope.sectionTitle = window.forum.getElementsByClassName('breadcrumb-actual-page')[0].innerHTML;
			topicsName = window.forum.getElementsByClassName("topicos");
			topicsAuthors = window.forum.getElementsByClassName("autor");
			topicsResp = window.forum.getElementsByClassName("respostas");
			$scope.topicos = angular.copy([]);
			topicos = [];
			for(var i = 0; i<topicsName.length; i++){
				tmpTopico = {
					"titulo":topicsName[i].getElementsByTagName('a')[0].getAttribute('title'),
					"linkT":topicsName[i].getElementsByTagName('a')[0].getAttribute('href')
				};
				tmpAuthor = topicsAuthors[i].getElementsByTagName('a')[0].innerHTML;
				tmpResp = topicsResp[i].innerHTML;

				tmpTopicoG = {
					"topico":tmpTopico,
					"author":tmpAuthor,
					"resp":tmpResp
				};
				topicos[i] = tmpTopicoG;
			}
			$scope.topicos = topicos;
      $scope.$broadcast('scroll.refreshComplete');
  		$scope.$apply();  // Nem sei se precisa mesmo de apply aqui... Estava tendo problemas
                        // na renderização da lista e parece que isso aqui resolveu... :lol:
		}
	}
	window.xhttp.onreadystatechange = xhttpRequestHandle;

	window.xhttp.open('GET', window.forumURL+section,true);
	window.xhttp.send();


  // Funções de usuário logo abaixo...

	$scope.doRefresh = function(){
    window.xhttp.onreadystatechange = xhttpRequestHandle;
  	window.xhttp.open('GET', window.forumURL+section,true);
  	window.xhttp.send();
	};

  $scope.goBack = function(){
    $state.go('sections',null,{reload:true});
  }

  $scope.goToTopic = function(index,isLastMsg){
    var n = topicos[index].resp.replace('.','');
    $rootScope.numberPages = Math.floor(n/20)+1;
    console.log($rootScope.numberPages);
    var q = '';
    if(isLastMsg) q = '?page='+$rootScope.numberPages;
    $rootScope.tpcId = topicos[index].topico.linkT.substr(topicos[index].topico.linkT.indexOf('t_',1)+2,7);
    $state.go('topic',{topc:topicos[index].topico.linkT+q},{});
    console.log(topicos[index].topico.linkT+q);
  }
}])

.controller('postsController',['$rootScope','$scope','$stateParams','$sce','$state','$location','$ionicScrollDelegate',function($rootScope,$scope,$stateParams,$sce,$state,$location,$ionicScrollDelegate){
  // Controller do tópico...
  // Aqui o usuário vai poder visualizar os posts (respostas ao tópico)
  // Vai poder responder, avaliar o tópico, negativar, positivar, quotar e mandar MP.

  if($rootScope.lastMsg) $scope.actualPage = $rootScope.numberPages;
  $scope.actualPage = 1;

  if($rootScope.isLogged) console.log(null);
    // redireciona o bot pra edit_profile...

  // <-- Códigozinho para extrair e tratar dados dos tópicos... -->
	window.xhttp.onreadystatechange = function(){
		if(window.xhttp.readyState == 4 && window.xhttp.status == 200){
      forum.innerHTML = window.xhttp.responseText;
      // extração dos dados do fórum
      $scope.secTitle = window.forum.getElementsByClassName('breadcrumb-actual-page')[0].innerHTML;
      $scope.topicTitle = window.forum.getElementsByClassName('titleTopic')[0].getElementsByTagName('h1')[0].innerHTML;
      firstPage = false;
      if($scope.actualPage===1){
        firstPage = true;
        rawTopic = window.forum.getElementsByClassName('autoClear  topicRow  post')[0];
        topicDate = window.forum.getElementsByClassName('topic-date')[0].innerHTML;
        topicRating = window.forum.getElementsByClassName('stars-li')[0];
      }
      $scope.firstPage = firstPage;
      rawPosts = window.forum.getElementsByClassName('autoClear  postRow  post');
      postsDates = window.forum.getElementsByClassName('left publishDate');
      postRating = window.forum.getElementsByClassName('votingResult');

      postsAuthors = window.forum.getElementsByClassName('userNickname');

      userContainer = window.forum.getElementsByClassName('left post-user');
      avatars = [];
      for (i=0; i<postsAuthors.length; i++){
        avatars[i] = userContainer[i].getElementsByTagName('img')[0].getAttribute('src');
      }
      descs = window.forum.getElementsByClassName('descricao');
      levels = window.forum.getElementsByClassName('userLevel');
      postsText = window.forum.getElementsByClassName('texto');
      $scope.posts = angular.copy([]);
      posts = [];
      for (i=0; i<postsAuthors.length; i++){
        tmpPost = {
          postAuthor: postsAuthors[i].getElementsByTagName('a')[0].innerHTML,
          avatar: avatars[i],
          msgs: descs[i].getElementsByTagName('b')[0].innerHTML,
          cadastro: descs[i].getElementsByTagName('b')[1].innerHTML,
          level: levels[i].innerHTML,
          postDate: (firstPage &&i===0)? topicDate :postsDates[firstPage?i-1:i].innerHTML.slice(25,41),
          postText: $sce.trustAsHtml(postsText[i].innerHTML),
          rating: (firstPage &&i===0)? topicRating :$sce.trustAsHtml(postRating[firstPage?i-1:i].innerHTML)
        }
        posts[i] = tmpPost;
      }
      $scope.posts = posts;
      $scope.$apply(); // vide linha 249.
      $ionicScrollDelegate.scrollTop();
		}
	}

  var topic = $stateParams.topc;
  window.xhttp.open('GET', window.forumURL+topic,true);
	window.xhttp.send();

  $scope.goBack = function(){
    $state.go('section',null,{reload:true});
  }

  $scope.goToPage = function(nP,lastMsg){
    if(lastMsg) nP = $rootScope.numberPages;
    $scope.actualPage = nP;
    window.xhttp.open('GET', window.forumURL+topic+'?page='+nP,true);
    window.xhttp.send();
  }
  $scope.goNext = function(){
    $scope.actualPage++;
    if($scope.actualPage>$rootScope.numberPages){
      $scope.actualPage--;
      return;
    }
    window.xhttp.open('GET', window.forumURL+topic+'?page='+$scope.actualPage,true);
    window.xhttp.send();
  }
  $scope.goPrev = function(){
    $scope.actualPage--;
    if($scope.actualPage<1){
      $scope.actualPage++;
      return;
    }
    window.xhttp.open('GET', window.forumURL+topic+'?page='+$scope.actualPage,true);
    window.xhttp.send();
  }
  $scope.goResp = function(mode){
    $rootScope.postMode = mode;
    $state.go('/p/post');
  }
}])

.controller('sendPostController',function($scope,$rootScope,$ionicHistory){
  $scope.titleString = ['Responder','Criar'];
  $scope.send = function(mode,tpcId){
    if(k==0){

    } else {

    }
    logBrowser.addEventListener('loadstop',postMsgHandler);
    logBrowser.executeScript({code:'location.replace("http://forum.jogos.uol.com.br/new_topic.jbb")'},function(){});
  }

});
