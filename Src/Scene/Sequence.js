/* *******************************************************************************
	シークエンスクラス
********************************************************************************/
var cc;
var Scene	= Scene || {};

/** シークエンス実体クラス
 * @class Sequence
 */
Scene.Sequence	= class Sequence{

	constructor(){
		this.DEFAULT_FUNCTION_TAG	= "_DEFAULT";

		/** @var このフェイズ開始してからのフレーム数 */
		this.count				= 0;
		/** @var 単純遷移における次フェイズ */
		this.nextSequence		= null;
		/** @var イベントリスナの対象レイヤ */
		this.listenTargetLayer	= null;
		/** @var 設定されたイベントリスナ群 */
		this.eventListeners		= [];

		/** @var {function[]} シーケンス開始時に行われる処理 */
		this.onStartFunctions	= {};
		/** @var {function[]} 当該シーケンスでのシーン更新時に呼ばれる処理 */
		this.updateFunctions	= {};

		this.Init();
	}

	/** インスタンス生成
	 * @static
	 * @returns this
	 * @memberof Sequence
	 */
	static Create(){return new this();}

	/** 初期化
	 * @returns this
	 * @memberof Sequence
	 */
	Init(){
		this.count	= 0;

		//イベントリスナ初期化＆設定
		this.ApplyEvents("GamePlay.Main",this.listenTargetLayer);

		//シーケンス開始時処理
		this.Start(null);
		return this;
	}

	/**シークエンス個別イベントの適用*/
	ApplyEvents(eventTag,layer){
		if(!layer)	return this;
		cc.eventManager.removeListeners(layer);
		(this.eventListeners[eventTag]||[])
			.filter(e=>e instanceof cc.EventListener)
			.forEach(e=>cc.eventManager.addListener(_.cloneDeep(e),layer));
		return this;
	}

	Start(tag=null){
		tag	= tag || this.DEFAULT_FUNCTION_TAG;
		for(let f of this.onStartFunctions[tag]||[]){
			if(typeof f==='function')	f(this);
		}
		return this;
	}

	/** 当該シーケンスのシーン更新処理
	 * @param {*} dt
	 * @returns this
	 * @memberof Sequence
	 */
	Update(dt,tag=null){
		tag	= tag || this.DEFAULT_FUNCTION_TAG;
		for(let f of this.updateFunctions[tag]||[]){
			if(typeof f==='function')	f(dt,this);
		}
		if(tag===this.DEFAULT_FUNCTION_TAG)	++this.count;
		return this;
	}

	/** シーケンス開始時の処理を追加
	 * @param {function|function[]} [funcs=null] Func(Sequence) またはその配列。省略時は処理をクリア。
	 * @returns this
	 * @memberof Sequence
	 */
	PushStartingFunctions(arg1=null,arg2=null){
		const tag	= typeof arg1==='string'	? arg1	: this.DEFAULT_FUNCTION_TAG;
		let funcs	= typeof arg1==='string'	? arg2	: arg1;
		//初期化
		if(funcs==null){
			this.onStartFunctions[tag]	= [];
			return this;
		}

		//追加
		if(!Array.isArray(funcs))	funcs	= [funcs];
		for(let f of funcs){
			if(typeof f==='function'){
				if(tag in this.onStartFunctions)	this.onStartFunctions[tag].push(f);
				else								this.onStartFunctions[tag] = [f];
			}
		}
		return this;
	}

	/** シーケンス毎のシーン更新処理を追加
	 * @param {function|function[]} [funcs=null] Func(dt,Sequence) またはその配列。省略時は処理をクリア。
	 * @returns this
	 * @memberof Sequence
	 */
	PushUpdatingFunctions(arg1=null,arg2=null){
		const tag	= typeof arg1==='string'	? arg1	: this.DEFAULT_FUNCTION_TAG;
		let funcs	= typeof arg1==='string'	? arg2	: arg1;
		//初期化
		if(funcs==null){
			this.updateFunctions[tag]	= [];
			return this;
		}
		//追加
		if(!Array.isArray(funcs))	funcs = [funcs];
		for(let f of funcs){
			if(typeof f==='function'){
				if(tag in this.updateFunctions)	this.updateFunctions[tag].push(f);
				else							this.updateFunctions[tag] = [f];
			}
		}
		return this;
	}

	/** イベントリスナの対象レイヤを設定
	 * @param {*} layer
	 * @returns
	 * @static
	 * @memberof Sequence
	 */
	SetListenerTarget(layer){
		this.listenTargetLayer	= layer;
		return this;
	}

	/** イベントリスナを設定
	 * @param {*} listeners
	 * @returns
	 * @memberof Sequence
	 */
	SetEventListeners(tag,listeners){
		if(!Array.isArray(listeners))	listeners	= [listeners];
		this.eventListeners[tag]	= listeners;
		return this;
	}
	PushEventListeners(tag,listeners){
		if(!Array.isArray(listeners))	listeners	= [listeners];
		this.eventListeners[tag].push(...listeners);
		return this;
	}


	/** 単純遷移における次フェイズを設定または取得
	 * @param {*} nextSeq 省略時はゲッタとして機能
	 * @returns {this|Sequenxe} セッタ時this、ゲッタ時Sequenceインスタンス
	 * @memberof Sequence
	 */
	NextPhase(nextSeq=undefined){
		if(nextSeq==undefined){
			return this.nextSequence;
		}
		else{
			this.nextSequence	= nextSeq;
			return this;
		}
	}

}
