/* *******************************************************************************
	シークエンスクラス
********************************************************************************/
var cc;

/** シークエンス実体クラス
 * @class Sequence
 */
class Sequence{
	constructor(){
		/** @var このフェイズ開始してからのフレーム数 */
		this.count				= 0;
		/** @var 単純遷移における次フェイズ */
		this.nextSequence		= null;
		/** @var イベントリスナの対象レイヤ */
		this.listenTargetLayer	= null;
		/** @var 設定されたイベントリスナ群 */
		this.eventListeners		= [];

		/** @var {function[]} シーケンス開始時に行われる処理 */
		this.onStartFunctions	= [];
		/** @var {function[]} 当該シーケンスでのシーン更新時に呼ばれる処理 */
		this.updateFunctions	= [];

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
		if(this.listenTargetLayer){
			cc.eventManager.removeListeners(this.listenTargetLayer);
			//共通イベント
			for(let e of Sequence._commonEventListeners){
				if(e instanceof cc.EventListener)	cc.eventManager.addListener(e,this.listenTargetLayer);
			}
			//個別イベント
			for(let e of this.eventListeners){
				if(e instanceof cc.EventListener)	cc.eventManager.addListener(e,this.listenTargetLayer);
			}
		}

		//シーケンス開始時処理
		for(let f of this.onStartFunctions){
			if(typeof f==='function')	f(this);
		}

		return this;
	}

	/** 当該シーケンスのシーン更新処理
	 * @param {*} dt
	 * @returns this
	 * @memberof Sequence
	 */
	Update(dt){
		for(let f of this.updateFunctions){
			if(typeof f==='function')	f(dt,this);
		}
		--this.count;
		return this;
	}

	/** シーケンス開始時の処理を追加
	 * @param {function|function[]} [funcs=null] Func(Sequence) またはその配列。省略時は処理をクリア。
	 * @returns this
	 * @memberof Sequence
	 */
	PushStartingFunctions(funcs=null){
		//初期化
		if(funcs==null){
			this.onStartFunctions	= [];
			return this;
		}
		//追加
		if(!Array.isArray(funcs))	funcs	= [funcs];
		for(let f of funcs){
			if(typeof f==='function')	this.onStartFunctions.push(f);
		}
		return this;
	}

	/** シーケンス毎のシーン更新処理を追加
	 * @param {function|function[]} [funcs=null] Func(dt,Sequence) またはその配列。省略時は処理をクリア。
	 * @returns this
	 * @memberof Sequence
	 */
	PushUpdatingFunctions(funcs=null){
		//初期化
		if(funcs==null){
			this.updateFunctions	= [];
			return this;
		}
		//追加
		if(!Array.isArray(funcs))	funcs	= [funcs];
		for(let f of funcs){
			if(typeof f==='function')	this.updateFunctions.push(f);
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
	SetEventListeners(listeners){
		if(Array.isArray(listeners))	this.eventListeners	= listeners;
		else							this.eventListeners	= [listeners];
		return this;
	}

	/** 共通イベントリスナを設定
	 * @static
	 * @param {*} listeners
	 * @memberof Sequence
	 */
	static SetCommonEventListeners(listeners){
		if(Array.isArray(listeners))	Sequence._commonEventListeners	= listeners;
		else							Sequence._commonEventListeners	= [listeners];
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

Sequence._commonEventListeners	= [];
