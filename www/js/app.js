// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'

forumURL = 'http://forum.jogos.uol.com.br/';  //para desenvolvimento mobile
//forumURL = '/forum/';                       //para testes no navegador via proxy; comente e descomente somente aqui.

angular.module('starter', ['ionic'])

.run(function($ionicPlatform,$rootScope,$ionicHistory) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
    xhttp = new XMLHttpRequest;
    forum = document.createElement('div');
    iframe = document.createElement("iframe");
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
    });
	$urlRouterProvider.otherwise('/');
})


.factory('login',['$http',function(){

}])

.controller('loginController',['$scope',function($scope){
  $scope.login = function(user,pass){
		user = encodeURI(''); //usuario
		pass = encodeURI(''); //senha
		var uniqueString = "XDomain";
		iframe.style.display = "none";
		iframe.contentWindow.name = uniqueString;
		// construct a form with hidden inputs, targeting the iframe
		form = document.createElement("form");
		form.target = uniqueString;
		form.action = "https://acesso.uol.com.br/login.html?skin=forum-jogos";
		form.method = "POST";

		// repeat for each parameter
		var input0 = document.createElement("input");
		var input1 = document.createElement("input");
		var input2 = document.createElement("input");
		var input3 = document.createElement("input");
		var input4 = document.createElement("input");

		input0.type = "hidden";
		input0.name = "user";
		input0.value = user;
		form.appendChild(input0);

		input1.type = "hidden";
		input1.name = "pass";
		input1.value = pass;
		form.appendChild(input1);

		input2.type = "hidden";
		input2.name = "skin";
		input2.value = "babelconteudo";
		form.appendChild(input2);

		input3.type = "hidden";
		input3.name = "dest";
		input3.value = "REDIR|http://forum.jogos.uol.com.br/";
		form.appendChild(input3);

		input4.type = "hidden";
		input4.name = "submit";
		input4.value = "Enviar";
		form.appendChild(input4);

		document.body.appendChild(form);

		document.createElement("form").submit.call(form);
	};
}])

.controller('indexController',['$scope',function($scope){
	$scope.showPopup = function(){

  };
}])

.controller('topicController',['$rootScope','$scope','$state','$stateParams',function($rootScope,$scope,$state,$stateParams){
	var relTopics = {
		"noticias":"noticias_f_56",
		"nintendo":"ds-wii-wii-u_f_39",
		"pc":"pc_f_40",
		"sony":"playstation-4-playstation-3-ps-vita_f_41",
		"ms":"xbox-one-xbox-360_f_43",
		"museu":"museu-do-videogame_f_44",
		"vale_tudo":"vale_tudo_f_57"
	};
  var section = relTopics[$stateParams.sec];
	/*topico = {
		"topico":{
			"titulo":"",
			"linkT":""
		},
		"author":"",
		"resp":0
	};*/
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
    $state.go('topic',{topc:topicos[index].topico.linkT+q},{});
    console.log(topicos[index].topico.linkT+q);
  }
}])

.controller('postsController',['$rootScope','$scope','$stateParams','$sce','$state','$location','$ionicScrollDelegate',function($rootScope,$scope,$stateParams,$sce,$state,$location,$ionicScrollDelegate){

  if($rootScope.lastMsg) $scope.actualPage = $rootScope.numberPages;
  $scope.actualPage = 1;

	xhttp.onreadystatechange = function(){
		if(xhttp.readyState == 4 && xhttp.status == 200){
      forum.innerHTML = xhttp.responseText;
      // extração dos dados do fórum
      $scope.secTitle = forum.getElementsByClassName('breadcrumb-actual-page')[0].innerHTML;
      $scope.topicTitle = forum.getElementsByClassName('titleTopic')[0].getElementsByTagName('h1')[0].innerHTML;
      firstPage = false;
      if($stateParams.topc.lastIndexOf('?')===-1||$location.search().page==='1'){
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
    $ionicScrollDelegate.scrollTop();
  }
  $scope.goPrev = function(){
    $scope.actualPage--;
    if($scope.actualPage<1){
      $scope.actualPage++;
      return;
    }
    xhttp.open('GET', forumURL+topic+'?page='+$scope.actualPage,true);
    xhttp.send();
    $ionicScrollDelegate.scrollTop();
  }
}]);
