// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'

forumURL = 'http://forum.jogos.uol.com.br/';  //para desenvolvimento mobile
forumURL = '/forum/';                       //para testes no navegador via proxy; comente e descomente somente aqui.
IdF = 57;

//Tratamento de eventos
loginHandler = function(event){
  console.log(event.url);
  if(event.url.indexOf('sac')===-1){
    showErrorMsg('Usuário ou senha incorreta');
  } else {
    localStorage.setItem('user',user);
    localStorage.setItem('pass',pass);
    localStorage.setItem('isLogged','1');
    $rootScope.asyncTask = false;
  }
  $rootScope.isLogged = true;
  logBrowser.removeEventListener('loadstop',loginHandler);

}
postMsgHandler = function(content,mode){
  if(mode=='topico')
    logBrowser.executeScript({code:'PostFunctions.insertPost("'+idF+','+content+'")'});
  else if(mode=='post')
    logBrowser.executeScript({code:'PostFunctions.insertTopic("'+content+'")'});
  logBrowser.removeEventListener('loadstop',postMsgHandler);
}

doLogin = function(){
  acessoUOL.log(localStorage.getItem('user'),localStorage.getItem('pass');
}

angular.module('starter', ['ionic'])

.run(function($ionicPlatform,$rootScope,$ionicHistory,$interval,acessoUOL) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
    $rootScope.asyncTask = false;
    //Variáveis de acesso global
    xhttp = new XMLHttpRequest;
    forum = document.createElement('div');
    logBrowser = window.open('https://acesso.uol.com.br','_blank','hidden=yes');

    $rootScope.$watch('isLogged',function(){

    });

    if( !localStorage.getItem('isLogged') || localStorage.getItem('isLogged') != 1 )
      $rootScope.isLogged = false;
    else {
      $rootScope.isLogged = true;
      $interval(doLogin),5*60*1000);
    }
  });
})

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

.service('acessoUOL',function($q){

  var log = function(user,pass){
    var d = $q.defer();
    $rootScope.asyncTask = true;
    user = user.trim();
    var loginscript = 'document.getElementsByTagName("input")[0].value = "'+user+'"; \
                      document.getElementsByTagName("input")[1].value = "'+pass+'"; \
                      document.getElementsByTagName("form")[0].submit(); \
                      return 0;';
    logBrowser.addEventListener('loaderror',function(event){
      def.resolve('Falha no envio de dados');
    });
    logBrowser.addEventListener('loadstop',loginHandler);
    logBrowser.executeScript({code:loginscript},function(){});
  }
  return {
    log: log
  }
})

.controller('loginController',['$scope','$rootScope','$interval','acessoUOL',function($scope,$rootScope,$interval,acessoUOL){

  function showErrorMsg(err){
    $scope.stat = 'Erro ao logar no fórum. ('+err+')';
    $rootScope.asyncTask = false;
  };

  $rootScope.asyncTask = false;
  $scope.login = acessoUOL.log($scope.user,$scope.pass);

  $scope.logoff = function(){
    localStorage.setItem('isLogged','0');
    $rootScope.isLogged = false;
  }

}])

.controller('indexController',['$scope',function($scope){

}])

.controller('topicController',['$rootScope','$scope','$state','$stateParams',function($rootScope,$scope,$state,$stateParams){
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

  $scope.topicos = [];
  xhttpRequestHandle = function(){
		if(xhttp.readyState == 4 && xhttp.status == 200){
			forum.innerHTML = xhttp.responseText;
      $scope.sectionTitle = forum.getElementsByClassName('breadcrumb-actual-page')[0].innerHTML;
			topicsName = forum.getElementsByClassName("topicos");
			topicsAuthors = forum.getElementsByClassName("autor");
			topicsResp = forum.getElementsByClassName("respostas");
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
  		$scope.$apply();
		}
	}
	xhttp.onreadystatechange = xhttpRequestHandle;

	xhttp.open('GET', forumURL+section,true);
	xhttp.send();

	$scope.doRefresh = function(){
    xhttp.onreadystatechange = xhttpRequestHandle;
  	xhttp.open('GET', forumURL+section,true);
  	xhttp.send();
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

  if($rootScope.lastMsg) $scope.actualPage = $rootScope.numberPages;
  $scope.actualPage = 1;

  if($rootScope.isLogged)
    topicBrowser = window.open('http://forum.jogos.uol.com.br/_t_'+tpcId,'_blank','hidden=yes');

	xhttp.onreadystatechange = function(){
		if(xhttp.readyState == 4 && xhttp.status == 200){
      forum.innerHTML = xhttp.responseText;
      // extração dos dados do fórum
      $scope.secTitle = forum.getElementsByClassName('breadcrumb-actual-page')[0].innerHTML;
      $scope.topicTitle = forum.getElementsByClassName('titleTopic')[0].getElementsByTagName('h1')[0].innerHTML;
      firstPage = false;
      if($scope.actualPage===1){
        firstPage = true;
        rawTopic = forum.getElementsByClassName('autoClear  topicRow  post')[0];
        topicDate = forum.getElementsByClassName('topic-date')[0].innerHTML;
        topicRating = forum.getElementsByClassName('stars-li')[0];
      }
      $scope.firstPage = firstPage;
      rawPosts = forum.getElementsByClassName('autoClear  postRow  post');
      postsDates = forum.getElementsByClassName('left publishDate');
      postRating = forum.getElementsByClassName('votingResult');

      postsAuthors = forum.getElementsByClassName('userNickname');

      userContainer = forum.getElementsByClassName('left post-user');
      avatars = [];
      for (i=0; i<postsAuthors.length; i++){
        avatars[i] = userContainer[i].getElementsByTagName('img')[0].getAttribute('src');
      }
      descs = forum.getElementsByClassName('descricao');
      levels = forum.getElementsByClassName('userLevel');
      postsText = forum.getElementsByClassName('texto');

      // tratamento das informções
      $scope.posts = angular.copy([]);
      posts = [];
      //insert some 'for' here
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
      // joga na view
      $scope.posts = posts;
      $scope.$apply();
      $ionicScrollDelegate.scrollTop();
		}
	}

  topic = $stateParams.topc;
  xhttp.open('GET', forumURL+topic,true);
	xhttp.send();

  $scope.goBack = function(){
    $state.go('section',null,{reload:true});
  }

  $scope.goToPage = function(nP,lastMsg){
    if(lastMsg) nP = $rootScope.numberPages;
    $scope.actualPage = nP;
    xhttp.open('GET', forumURL+topic+'?page='+nP,true);
    xhttp.send();
  }
  $scope.goNext = function(){
    $scope.actualPage++;
    if($scope.actualPage>$rootScope.numberPages){
      $scope.actualPage--;
      return;
    }
    xhttp.open('GET', forumURL+topic+'?page='+$scope.actualPage,true);
    xhttp.send();
  }
  $scope.goPrev = function(){
    $scope.actualPage--;
    if($scope.actualPage<1){
      $scope.actualPage++;
      return;
    }
    xhttp.open('GET', forumURL+topic+'?page='+$scope.actualPage,true);
    xhttp.send();
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
