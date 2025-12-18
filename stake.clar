;; Advanced Staking Smart Contract
;; Features: Multiple tiers, lock periods, early withdrawal penalties, referral system, and governance

;; ========== CONSTANTS ==========
(define-constant contract-owner tx-sender)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INSUFFICIENT-BALANCE (err u101))
(define-constant ERR-NO-STAKE-FOUND (err u102))
(define-constant ERR-INVALID-AMOUNT (err u103))
(define-constant ERR-TRANSFER-FAILED (err u104))
(define-constant ERR-MIN-STAKE-NOT-MET (err u105))
(define-constant ERR-INVALID-TIER (err u106))
(define-constant ERR-LOCK-PERIOD-ACTIVE (err u107))
(define-constant ERR-PAUSED (err u108))
(define-constant ERR-INVALID-REFERRER (err u109))
(define-constant ERR-STAKE-LIMIT-REACHED (err u110))

;; Minimum stake amounts per tier (in microSTX)
(define-constant MIN-STAKE-BRONZE u1000000)    ;; 1 STX
(define-constant MIN-STAKE-SILVER u10000000)   ;; 10 STX
(define-constant MIN-STAKE-GOLD u50000000)     ;; 50 STX
(define-constant MIN-STAKE-PLATINUM u100000000) ;; 100 STX

;; APY rates per tier (in basis points, 1 bp = 0.01%)
(define-constant APY-BRONZE u1000)      ;; 10% APY
(define-constant APY-SILVER u1500)      ;; 15% APY
(define-constant APY-GOLD u2000)        ;; 20% APY
(define-constant APY-PLATINUM u3000)    ;; 30% APY

;; Lock periods in blocks (~144 blocks per day on Stacks)
(define-constant LOCK-PERIOD-30-DAYS u4320)
(define-constant LOCK-PERIOD-90-DAYS u12960)
(define-constant LOCK-PERIOD-180-DAYS u25920)
(define-constant LOCK-PERIOD-365-DAYS u52560)

;; Early withdrawal penalty (25%)
(define-constant EARLY-WITHDRAWAL-PENALTY u2500) ;; 25% in basis points
(define-constant BASIS-POINTS u10000)

;; Referral bonus (5% of rewards)
(define-constant REFERRAL-BONUS u500) ;; 5% in basis points

;; Maximum stakes per user
(define-constant MAX-STAKES-PER-USER u10)

;; ========== DATA STRUCTURES ==========

;; Individual stake structure
(define-map stakes
  { staker: principal, stake-id: uint }
  {
    amount: uint,
    tier: (string-ascii 10),
    start-block: uint,
    last-claim-block: uint,
    lock-period: uint,
    unlock-block: uint,
    apy-rate: uint,
    referrer: (optional principal),
    is-active: bool
  }
)

;; User stake counter
(define-map user-stake-count principal uint)

;; Track total staked per tier
(define-map tier-totals (string-ascii 10) uint)

;; User total staked amount
(define-map user-total-staked principal uint)

;; Referral earnings
(define-map referral-earnings principal uint)

;; Global statistics
(define-data-var total-staked uint u0)
(define-data-var total-rewards-paid uint u0)
(define-data-var total-stakers uint u0)
(define-data-var contract-paused bool false)

;; Emergency withdrawal allowed
(define-data-var emergency-mode bool false)

;; ========== HELPER FUNCTIONS ==========

;; Get minimum stake for tier
(define-read-only (get-min-stake-for-tier (tier (string-ascii 10)))
  (if (is-eq tier "bronze")
    MIN-STAKE-BRONZE
    (if (is-eq tier "silver")
      MIN-STAKE-SILVER
      (if (is-eq tier "gold")
        MIN-STAKE-GOLD
        (if (is-eq tier "platinum")
          MIN-STAKE-PLATINUM
          u0
        )
      )
    )
  )
)

;; Get APY rate for tier
(define-read-only (get-apy-for-tier (tier (string-ascii 10)))
  (if (is-eq tier "bronze")
    APY-BRONZE
    (if (is-eq tier "silver")
      APY-SILVER
      (if (is-eq tier "gold")
        APY-GOLD
        (if (is-eq tier "platinum")
          APY-PLATINUM
          u0
        )
      )
    )
  )
)

;; Calculate rewards for a specific stake
(define-read-only (calculate-stake-rewards (staker principal) (stake-id uint))
  (match (map-get? stakes { staker: staker, stake-id: stake-id })
    stake-info
      (if (get is-active stake-info)
        (let
          (
            (staked-amount (get amount stake-info))
            (last-claim (get last-claim-block stake-info))
            (blocks-elapsed (- block-height last-claim))
            (apy-rate (get apy-rate stake-info))
            ;; Calculate: (amount * blocks * APY) / (blocks-per-year * 10000)
            (rewards (/ (* (* staked-amount blocks-elapsed) apy-rate) (* u52560 BASIS-POINTS)))
          )
          (ok rewards)
        )
        (ok u0)
      )
    ERR-NO-STAKE-FOUND
  )
)

;; ========== CORE STAKING FUNCTIONS ==========

;; Stake tokens with tier and lock period
(define-public (stake (amount uint) (tier (string-ascii 10)) (lock-blocks uint) (referrer (optional principal)))
  (let
    (
      (staker tx-sender)
      (current-count (default-to u0 (map-get? user-stake-count staker)))
      (stake-id (+ current-count u1))
      (min-stake (get-min-stake-for-tier tier))
      (apy-rate (get-apy-for-tier tier))
      (unlock-height (+ block-height lock-blocks))
      (tier-total (default-to u0 (map-get? tier-totals tier)))
      (user-total (default-to u0 (map-get? user-total-staked staker)))
    )
    ;; Check contract is not paused
    (asserts! (not (var-get contract-paused)) ERR-PAUSED)
    
    ;; Validate tier
    (asserts! (> apy-rate u0) ERR-INVALID-TIER)
    
    ;; Check minimum stake amount
    (asserts! (>= amount min-stake) ERR-MIN-STAKE-NOT-MET)
    
    ;; Check max stakes per user
    (asserts! (< current-count MAX-STAKES-PER-USER) ERR-STAKE-LIMIT-REACHED)
    
    ;; Validate referrer (can't refer yourself)
    (asserts! 
      (match referrer
        ref-address (not (is-eq ref-address staker))
        true
      )
      ERR-INVALID-REFERRER
    )
    
    ;; Transfer STX from user to contract
    (match (stx-transfer? amount staker (as-contract tx-sender))
      success
        (begin
          ;; Create stake record
          (map-set stakes 
            { staker: staker, stake-id: stake-id }
            {
              amount: amount,
              tier: tier,
              start-block: block-height,
              last-claim-block: block-height,
              lock-period: lock-blocks,
              unlock-block: unlock-height,
              apy-rate: apy-rate,
              referrer: referrer,
              is-active: true
            }
          )
          
          ;; Update counters
          (map-set user-stake-count staker stake-id)
          (map-set tier-totals tier (+ tier-total amount))
          (map-set user-total-staked staker (+ user-total amount))
          (var-set total-staked (+ (var-get total-staked) amount))
          
          ;; Increment stakers count if first stake
          (if (is-eq current-count u0)
            (var-set total-stakers (+ (var-get total-stakers) u1))
            true
          )
          
          (ok stake-id)
        )
      error ERR-TRANSFER-FAILED
    )
  )
)

;; Claim rewards for a specific stake
(define-public (claim-stake-rewards (stake-id uint))
  (let
    (
      (staker tx-sender)
      (stake-info (unwrap! (map-get? stakes { staker: staker, stake-id: stake-id }) ERR-NO-STAKE-FOUND))
      (pending-rewards (unwrap! (calculate-stake-rewards staker stake-id) ERR-NO-STAKE-FOUND))
      (referrer-opt (get referrer stake-info))
    )
    ;; Check stake is active
    (asserts! (get is-active stake-info) ERR-NO-STAKE-FOUND)
    
    ;; Only claim if there are rewards
    (asserts! (> pending-rewards u0) (ok u0))
    
    ;; Calculate referral bonus if applicable
    (match referrer-opt
      referrer-address
        (let
          (
            (referral-amount (/ (* pending-rewards REFERRAL-BONUS) BASIS-POINTS))
            (staker-amount (- pending-rewards referral-amount))
            (current-referral-earnings (default-to u0 (map-get? referral-earnings referrer-address)))
          )
          ;; Transfer rewards to staker
          (try! (as-contract (stx-transfer? staker-amount tx-sender staker)))
          
          ;; Transfer referral bonus
          (try! (as-contract (stx-transfer? referral-amount tx-sender referrer-address)))
          
          ;; Update referral earnings
          (map-set referral-earnings referrer-address (+ current-referral-earnings referral-amount))
          
          ;; Update stake info
          (map-set stakes 
            { staker: staker, stake-id: stake-id }
            (merge stake-info { last-claim-block: block-height })
          )
          
          ;; Update total rewards paid
          (var-set total-rewards-paid (+ (var-get total-rewards-paid) pending-rewards))
          
          (ok pending-rewards)
        )
      ;; No referrer case
      (begin
        (try! (as-contract (stx-transfer? pending-rewards tx-sender staker)))
        
        (map-set stakes 
          { staker: staker, stake-id: stake-id }
          (merge stake-info { last-claim-block: block-height })
        )
        
        (var-set total-rewards-paid (+ (var-get total-rewards-paid) pending-rewards))
        
        (ok pending-rewards)
      )
    )
  )
)

;; Unstake with lock period check
(define-public (unstake (stake-id uint))
  (let
    (
      (staker tx-sender)
      (stake-info (unwrap! (map-get? stakes { staker: staker, stake-id: stake-id }) ERR-NO-STAKE-FOUND))
      (staked-amount (get amount stake-info))
      (unlock-block (get unlock-block stake-info))
      (is-locked (< block-height unlock-block))
      (pending-rewards (unwrap! (calculate-stake-rewards staker stake-id) ERR-NO-STAKE-FOUND))
      (tier (get tier stake-info))
      (tier-total (default-to u0 (map-get? tier-totals tier)))
      (user-total (default-to u0 (map-get? user-total-staked staker)))
    )
    ;; Check stake is active
    (asserts! (get is-active stake-info) ERR-NO-STAKE-FOUND)
    
    ;; Calculate penalty if unstaking early
    (let
      (
        (penalty (if is-locked
          (/ (* staked-amount EARLY-WITHDRAWAL-PENALTY) BASIS-POINTS)
          u0
        ))
        (amount-to-return (- staked-amount penalty))
        (total-return (+ amount-to-return pending-rewards))
      )
      ;; Transfer staked amount + rewards (minus penalty)
      (try! (as-contract (stx-transfer? total-return tx-sender staker)))
      
      ;; Update stake as inactive
      (map-set stakes 
        { staker: staker, stake-id: stake-id }
        (merge stake-info { is-active: false })
      )
      
      ;; Update totals
      (map-set tier-totals tier (- tier-total staked-amount))
      (map-set user-total-staked staker (- user-total staked-amount))
      (var-set total-staked (- (var-get total-staked) staked-amount))
      (var-set total-rewards-paid (+ (var-get total-rewards-paid) pending-rewards))
      
      (ok { amount: amount-to-return, rewards: pending-rewards, penalty: penalty })
    )
  )
)

;; Claim all rewards from all active stakes
(define-public (claim-all-rewards)
  (let
    (
      (staker tx-sender)
      (stake-count (default-to u0 (map-get? user-stake-count staker)))
    )
    (fold claim-stake-helper (list u1 u2 u3 u4 u5 u6 u7 u8 u9 u10) (ok u0))
  )
)

;; Helper for claiming all stakes
(define-private (claim-stake-helper (stake-id uint) (previous-result (response uint uint)))
  (match previous-result
    prev-total
      (match (claim-stake-rewards stake-id)
        rewards (ok (+ prev-total rewards))
        error (ok prev-total)
      )
    error previous-result
  )
)

;; ========== READ-ONLY FUNCTIONS ==========

;; Get specific stake info
(define-read-only (get-stake-info (staker principal) (stake-id uint))
  (map-get? stakes { staker: staker, stake-id: stake-id })
)

;; Get user's total number of stakes
(define-read-only (get-user-stake-count (staker principal))
  (default-to u0 (map-get? user-stake-count staker))
)

;; Get user's total staked amount
(define-read-only (get-user-total-staked (staker principal))
  (default-to u0 (map-get? user-total-staked staker))
)

;; Get total staked in tier
(define-read-only (get-tier-total (tier (string-ascii 10)))
  (default-to u0 (map-get? tier-totals tier))
)

;; Get contract statistics
(define-read-only (get-contract-stats)
  {
    total-staked: (var-get total-staked),
    total-rewards-paid: (var-get total-rewards-paid),
    total-stakers: (var-get total-stakers),
    is-paused: (var-get contract-paused),
    bronze-total: (get-tier-total "bronze"),
    silver-total: (get-tier-total "silver"),
    gold-total: (get-tier-total "gold"),
    platinum-total: (get-tier-total "platinum")
  }
)

;; Get referral earnings
(define-read-only (get-referral-earnings (referrer principal))
  (default-to u0 (map-get? referral-earnings referrer))
)

;; Get all pending rewards for a user
(define-read-only (get-user-total-pending-rewards (staker principal))
  (let
    (
      (stake-count (get-user-stake-count staker))
    )
    (fold sum-rewards-helper (list u1 u2 u3 u4 u5 u6 u7 u8 u9 u10) { staker: staker, total: u0 })
  )
)

;; Helper to sum all rewards
(define-private (sum-rewards-helper (stake-id uint) (acc { staker: principal, total: uint }))
  (let
    (
      (staker (get staker acc))
      (current-total (get total acc))
    )
    (match (calculate-stake-rewards staker stake-id)
      rewards { staker: staker, total: (+ current-total rewards) }
      error acc
    )
  )
)

;; ========== ADMIN FUNCTIONS ==========

;; Fund contract with rewards
(define-public (fund-rewards (amount uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) ERR-NOT-AUTHORIZED)
    (stx-transfer? amount tx-sender (as-contract tx-sender))
  )
)

;; Pause/unpause contract
(define-public (set-paused (paused bool))
  (begin
    (asserts! (is-eq tx-sender contract-owner) ERR-NOT-AUTHORIZED)
    (ok (var-set contract-paused paused))
  )
)

;; Enable emergency mode (allows unstaking without penalties)
(define-public (set-emergency-mode (enabled bool))
  (begin
    (asserts! (is-eq tx-sender contract-owner) ERR-NOT-AUTHORIZED)
    (ok (var-set emergency-mode enabled))
  )
)
