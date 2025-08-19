// src/main.tsx
/*
Notlar:
Ana dosya: Uygulamanın başlangıç noktasıdır.
Redux Store: Uygulamanın tüm state yönetimini sağlar.
Router: Sayfalar arası yönlendirme işlevini sağlar.
Ana Uygulama Bileşeni: Uygulamanın görünen tüm bileşenlerini içerir.
Provider:  Bu özel bileşen, Redux store'unu tüm React uygulama ağacına "sağlar" (provide eder).
store: Uygulamanın tüm state'ini tutan ve Redux Toolkit ile oluşturulan "store" nesnesidir.
*/

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import App from './App';
import './index.css';

// ReactDOM.createRoot(): Bu komut, HTML belgenizdeki id="root" etiketine sahip DOM öğesini seçer.
// ! (Non-null Assertion Operator): TypeScript'te, document.getElementById('root') ifadesi potansiyel olarak null dönebilir.
// ! işareti, geliştirici olarak bu elementin var olduğundan emin olduğunuzu TypeScript'e söyler
//  ve olası bir hatayı görmezden gelmesini sağlar.
ReactDOM.createRoot(document.getElementById('root')!).render(
	// React.StrictMode: Bu, uygulamanızın potansiyel sorunlarını tespit etmek için kullanılan bir araçtır.
	//  <Provider store={store} Uygulamanızdaki tüm bileşenlerin Redux store'una erişmesini sağlar. store={store} prop'u ile hangi store'u kullanacağını belirtirsiniz.
	//  Bu sayede useSelector gibi hook'ları herhangi bir bileşende kullanabilirsiniz.
	// Router: React Router kullanarak uygulamanızın sayfaları arasında gezinmeyi sağlar.
	// App: Uygulamanızın ana bileşenidir. Bu bileşen, uygulamanızın tüm görünümünü ve yönlendirmesini içerir. 
	<React.StrictMode>
		<Provider store={store}>
			<Router>
				<App />
			</Router>
		</Provider>
	</React.StrictMode>
);
