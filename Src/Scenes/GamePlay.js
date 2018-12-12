/* *******************************************************************************
	GamePlayシーン
********************************************************************************/
var Scenes	= Scenes || {};
var cc;
(function(){	//File Scope

/** classへのthis */
let _this	= null;
/** シークエンス列挙型 */
const Sequences	= {
	/**初期状態*/		INITIAL			: Sequence.Create(),
	/**エイム作動*/		START_AIM		: Sequence.Create(),
	/**打撃予備動作*/	PRELIMINARY		: Sequence.Create(),
	/**打撃動作*/		DISCHARGE		: Sequence.Create(),
	/**エミット中*/		EMIT			: Sequence.Create(),
	/**吹き飛ばし*/		BLOW_AWAY		: Sequence.Create(),
	/**測定中*/			MEASURE			: Sequence.Create(),
	/**動作失敗*/		DISCHARGE_FAILED: Sequence.Create(),
};
/** 打撃定数 */
const BlowPower	= {
	/**上限値*/			MIN				: 0,
	/**上限値*/			MAX				: 60*256,
	/**初期値*/			INITIAL			: 0,
	/**増分*/			INCREMENT		: 1*256,
	/**失敗時の減少*/	DECREMENT		: 1*256,
	/**主動作の速度*/	DISCHARGE_SPEED	: 4*256,
	/**主動作の加速度*/	ACCELERATION	: 1.10,
};
/** エミットエナジー定数*/
const EmitEnergy	= {
	/**エミット受付期間*/	ACCEPTION_COUNT		: 300,
	/**エミット加算値*/		ADDITIONAL_POWER	: 128,
};
/** リンクされたレイヤーのタグ */
const LinkedLayerTags	= {
	MAIN	: 0,
	BG		: 1,
};

Scenes.GamePlay	= class extends Scenes.SceneBase {

	constructor(){
		super();
		_this					= this;

		//インパクトシークエンス
		/** @var チャージ時間 */
		this.chargingCount		= BlowPower.INITIAL;
		/** @var チャージ量 */
		this.chargedPower		= 0;
		/** 打撃動作のアニメーション速度 */
		this.dischargeSpeed		= 0;
		/** @var エイミングゲージ */
		this.aiming				= null;

		//エミットエナジーシークエンス
		/** @var エミット受付時間*/
		this.acceptEmitting		= 0;
		/** @var エミットカウンタ */
		this.nEmits	= {
			/**合計 */		total		: 0,
			/**同時*/		simul		: 0,
			/**同時最大*/	maxSimul	: 1,
		};

		//結果表示用
		/** @var インパクト時の威力*/
		this.impactPower		= 0;
		/** @var 最終的に与えられた威力 */
		this.totalPower			= 0;
		/** @var 隕石の移動距離 */
		this.distanceOfMeteor	= 0;

		/** ccSceneのインスタンス */
		this.ccSceneInstance	= new (cc.Scene.extend({
			/** 生成 */
			onEnter	: function (){
				this._super();
				_this.aiming	= Scenes.Aiming
									.Create()
									.PushHitArea( "CRITICAL",	-0.10,	0.10 )
									.PushHitArea( "GOOD",		-0.25,	0.25 )
									.PushHitArea( "NORMAL",		-0.75,	0.75 );

				_this.SetLayer(LinkedLayerTags.BG,  _this.ccLayers.bg);
				_this.SetLayer(LinkedLayerTags.MAIN,_this.ccLayers.main);
				_this.InitSequence(Sequences.INITIAL,Sequences,_this.ccLayerInstances[LinkedLayerTags.MAIN]);
				_this.sequence.Init();

				this.scheduleUpdate();
			},
			/** 更新 */
			update	: function(dt){
				_this.OnUpdating(dt);
				_this.sequence.Update(dt);
				_this.OnUpdated(dt);
			},
		}))();

		/** ccLayerに渡す用 */
		this.ccLayers	= {
			main	: cc.Layer.extend({
				ctor:function(){
					this._super();
					this.init();
					this.scheduleUpdate();
					return true;
				},
				init	: function(){
					this._super();

					_this.chargingCount		= BlowPower.INITIAL;
					_this.chargedPower		= 0;
					_this.dischargeSpeed	= 0;
					_this.SetSequence(Sequences.INITIAL);
					_this.sprites.player	= Sprite.CreateInstance(rc.img.player).AddToLayer(this)
												.SetScale(2).SetPosition(100,70);
					_this.sprites.meteor	= Sprite.CreateInstance(rc.img.meteor).AddToLayer(this)
												.SetScale(2).SetPosition(250,110).Attr({zIndex:2});
					_this.meteorEffect	= Effects.Meteor.Create(8).Init(this);
					_this.playerEffect	= Effects.Fly.Create(32).Init(this);

					_this.aiming.Init().SetLayer(this).SetSpritePosition(140,100);

					//Labels
					{let i=0; for(let key in _this.labels){
						_this.labels[key]	= Label.CreateInstance().SetColor("#FFFFFF").SetPosition(120,270-i*20).AddToLayer(this);
						++i;
					}};

					return true;
				},
				update	: function(dt){
					this._super();

					//Player
					_this.UpdatePlayerSprite();

					_this.sprites.meteor.SetPosition(250,120+NormalRandom(4)).Rotate(-7);
					_this.meteorEffect.Spawn(_this.sequence.count%15==0).Update();

					_this.labels.chargedPower.SetString(	`Charge Rate:${_this.GetChargingRate().toFixed(2)}`		);
					_this.labels.hitArea.SetString(			`Hit Area:${_this.aiming.GetCurrentArea().tag}`	);
					_this.labels.aiming.SetString(			`Aiming:${_this.aiming.position.toFixed(2)}`	);
					_this.labels.emittingPower.SetString(	`Emitting:${_this.nEmits.total}c, ${_this.nEmits.maxSimul}c/f, ${_this.GetEmittingRate()}x`	);
					return true;
				},
			}),
			bg	: cc.Layer.extend({
				ctor:function(){
					this._super();
					this.init();
					this.scheduleUpdate();
					return true;
				},
				init	: function(){
					this._super();
					//_this.SetBackgroundColor(this,"#000000");
					const size	= cc.director.getWinSize();
					_this.sprites.bg	= [0,1].map(i=>Sprite.CreateInstance(rc.img.bg).AddToLayer(this).SetPosition(size.width/2,size.height/2));
				},
				update	: function(){
					this._super();
					const size	= cc.director.getWinSize();
					_this.sprites.bg[0].SetPosition(size.width/2-Cycle(-_this.sequence.count*8,0,640),size.height/2);
					_this.sprites.bg[1].SetPosition(size.width/2-Cycle(-_this.sequence.count*8,0,640)+640,size.height/2);
				},
			}),
		};

		/** ラベル */
		this.labels	= {	chargedPower:null,	hitArea:null,	aiming:null,	emittingPower:null,	}

		//シークエンス設定
		this.SetSequenceFunctions().InitEventListeners();
	}


	/** シーケンス毎の処理を定義
	 * @returns this
	 */
	SetSequenceFunctions(){
		//初期状態
	//	Sequences.INITIAL.PushStartingFunctions(()=>{}).PushUpdatingFunctions((dt)=>{});

		//エイム作動
		Sequences.START_AIM
		//	.PushStartingFunctions(()=>{})
			.PushUpdatingFunctions((dt)=>{
				this.aiming.Update();
			});

		//打撃予備動作
		Sequences.PRELIMINARY
		//	.PushStartingFunctions(()=>{})
			.PushUpdatingFunctions((dt)=>{
				this.aiming.Update();
				this.chargingCount += BlowPower.INCREMENT;
				if(this.chargingCount > BlowPower.MAX)	this.SetSequence(Sequences.DISCHARGE_FAILED);
			});

		//打撃動作
		Sequences.DISCHARGE
			.PushStartingFunctions(()=>{
				this.chargedPower	= this.chargingCount;
				this.dischargeSpeed	= BlowPower.DISCHARGE_SPEED;
			})
			.PushUpdatingFunctions((dt)=>{
				this.aiming.Update();
				this.dischargeSpeed *= BlowPower.ACCELERATION;
				this.chargingCount -= this.dischargeSpeed;
				if(this.chargingCount < BlowPower.MIN){
					this.SetSequence(Sequences.EMIT);
				}
			});

		//打撃動作失敗
		Sequences.DISCHARGE_FAILED
		//	.PushStartingFunctions(()=>{})
			.PushUpdatingFunctions((dt)=>{
				this.aiming.Update();
				this.chargingCount-=BlowPower.DECREMENT;
				if(this.chargingCount < BlowPower.MIN)	this.SetSequence(Sequences.START_AIM);
			});

		//エミット中
		Sequences.EMIT
			.PushStartingFunctions(()=>{
				this.nEmits.simul		= 0;
				this.nEmits.maxSimul	= 1;
				this.acceptEmitting		= EmitEnergy.ACCEPTION_COUNT;
				this.nEmits.total		= 0;
			})
			.PushUpdatingFunctions((dt)=>{
				this.acceptEmitting--;
				if(this.acceptEmitting < 0)	this.SetSequence(Sequences.BLOW_AWAY);

				//マルチタッチ検出
				this.nEmits.maxSimul	= Math.max(this.nEmits.simul,this.nEmits.maxSimul);
				this.nEmits.simul		= 0;
			});

		//吹き飛ばし
		Sequences.BLOW_AWAY.PushStartingFunctions(()=>{
			this.impactPower	= this.GetChargingRate() * this.aiming.GetTotalRate();
			this.totalPower		= this.GetEmittingRate() * this.impactPower;

			Log(`Emit: ${this.nEmits.total}c, ${this.nEmits.maxSimul}c/f, ${this.GetEmittingRate()}x`);
			Log(`AimingRate: ${this.aiming.GetRate(true)}`);
			Log(`Impact: ${this.impactPower}`);
			Log(`Total: ${this.totalPower}`);
		});
		//.PushUpdatingFunctions((dt)=>{});

		//計測中
	//	Sequences.MEASURE.PushStartingFunctions(()=>{}).PushUpdatingFunctions((dt)=>{});

		return this;
	}


	/** イベントリスナ初期設定
	 * @returns this
	 */
	InitEventListeners(){

		/**イベントリスナ*/
		this.listeners	= {
			/** インパクトフェイズ */
			discharge	: cc.EventListener.create({
				event			: cc.EventListener.TOUCH_ALL_AT_ONCE,
				onTouchesBegan	: (touch,event)=>{
					if(this.sequence===Sequences.START_AIM){
						this.SetSequence(Sequences.PRELIMINARY);
						return true;
					}
					return false;
				},
				onTouchesEnded	: (touch,event)=>{
					if(this.sequence===Sequences.PRELIMINARY)	this.SetSequence(Sequences.DISCHARGE);
				},
			}),
			/** エミットエナジーフェイズ */
			emitEnergy	: cc.EventListener.create({
				event			: cc.EventListener.TOUCH_ALL_AT_ONCE,
				onTouchesBegan	: (touch,event)=>{
					this.nEmits.simul++;
					this.nEmits.total++;
				},
			}),
			/** リセット */
			reset		: !cc._EventListenerKeyboard ? null : cc.EventListener.create({
				event			: cc.EventListener.KEYBOARD,
				onKeyReleased	: (code,event)=>{
					if(code==82){	//'R'key
						Log("[DEBUG] Reset Scene ----------");
						this.SetSequence(Sequences.INITIAL);
					}
				},
			}),
			/** 次フェイズへの単純遷移 */
			transionToNext	:cc.EventListener.create({
				event			: cc.EventListener.TOUCH_ALL_AT_ONCE,
				onTouchesBegan	: (touch,event)=>{
					if(this.sequence.NextPhase())	this.SetSequence(this.sequence.NextPhase());
					return true;
				},
			}),
		};

		//シークエンス-イベント対応設定
		Debug(()=>Sequence.SetCommonEventListeners(	this.listeners.reset			));
		Sequences.INITIAL.SetEventListeners(		this.listeners.transionToNext	).NextPhase(Sequences.START_AIM);
		Sequences.START_AIM.SetEventListeners(		this.listeners.discharge		);
		Sequences.PRELIMINARY.SetEventListeners(	this.listeners.discharge		);
		Sequences.EMIT.SetEventListeners(			this.listeners.emitEnergy		);

		return this;
	}


	/** エミット倍率を取得
	 * @returns number
	 */
	GetEmittingRate(){
		let power	= 0;
		let add		= EmitEnergy.ADDITIONAL_POWER;
		//エミット値の加算
		for(let i=0; i<this.nEmits.total; ++i){
			power	+= add;
			add		= Math.max(1,--add);
		}
		//マルチタッチ補正
		const rateSimul	= this.nEmits.maxSimul + (this.nEmits.maxSimul-1)/2;

		return power / (rateSimul * EmitEnergy.ADDITIONAL_POWER *50) + 1;
	}

	/** チャージ倍率を取得
	 * @returns {number} 20-80
	 */
	GetChargingRate(){
		return this.chargedPower/BlowPower.INCREMENT + 20;
	}

	/**プレイヤー画像の表示*/
	UpdatePlayerSprite(){
		//ｙ座標
		let dy	= this.sprites.player.GetCustomData("dy");
		if(dy==null) dy=0.25;
		if(this.sprites.player.y<100)	dy+=0.005;
		else							dy-=0.005;
		if     (dy> 0.25) dy= 0.25;
		else if(dy<-0.25) dy=-0.25;

		//スプライト番号
		let idx	= 0;
		if([Sequences.INITIAL,Sequences.START_AIM,Sequences.PRELIMINARY,Sequences.DISCHARGE_FAILED].includes(this.sequence)){
			idx	= parseInt(this.sequence.count/15) % 2;
		}
		else if([Sequences.DISCHARGE].includes(this.sequence)){
			idx	= this.chargedPower<BlowPower.MAX/2	? 2	: 5;
		}
		else{
			idx	= 3;
			if(this.chargedPower >= BlowPower.MAX/2)	idx	= this.sequence.count<15	? 6 : 7;
		}

		this.sprites.player.SetIndex(idx).SetPosition(100-this.chargingCount/512,null).SetRelativePosition(null,dy).SetCustomData("dy",dy);
		this.playerEffect.Spawn(this.sprites.player.x,this.sprites.player.y-32).Update();
		return this;
	}

}//class


})();	//File Scope


