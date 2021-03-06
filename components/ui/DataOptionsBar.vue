<template>
  <div class="data-options-bar">
    <div class="range-buttons buttons has-addons">
      <button
        v-for="(r, i) in ranges"
        :key="i"
        :class="{ 'is-selected': r.range === selectedRange }"
        class="button is-rounded"
        @click="handleRangeChange(r.range)">
        {{ r.range }}
      </button>
    </div>

    <div class="buttons has-addons">
      <button
        v-on-clickaway="handleClickAway"
        v-for="(interval, i) in selectedRangeIntervals"
        :key="i"
        :class="{ 'is-selected': interval === selectedInterval }"
        class="button is-rounded"
        @click.stop="handleIntervalChange(interval)">

        <div v-if="!hasFilter(interval)">{{ interval }}</div>
        <div v-if="hasFilter(interval)">{{ intervalLabel(interval) }}</div>
        <i
          v-if="hasFilter(interval)"
          class="filter-caret fal fa-chevron-down" />
        
        <div
          v-show="showFilter(interval)"
          class="filter-menu dropdown-menu">
          <div class="dropdown-content">
            <a
              v-for="(period, i) in filters"
              :key="`period${i}`"
              :class="{ 'is-selected': filterPeriod === period }"
              class="dropdown-item"
              @click.stop="handleFilterPeriodClick(period)">
              {{ period }}
            </a>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script>
import { mixin as clickaway } from 'vue-clickaway'
import RANGE_INTERVAL from '~/constants/rangeInterval.js'
import INTERVAL_PERIOD from '~/constants/intervalPeriod.js'

export default {
  mixins: [clickaway],
  props: {
    range: {
      type: String,
      default: () => ''
    },
    interval: {
      type: String,
      default: () => ''
    }
  },

  data() {
    return {
      ranges: RANGE_INTERVAL,
      intervalPeriod: INTERVAL_PERIOD,
      selectedRange: '',
      selectedInterval: '',
      showSeasonFilter: false,
      showQuarterFilter: false,
      seasonFilters: INTERVAL_PERIOD['Season'],
      quarterFilters: INTERVAL_PERIOD['Quarter']
    }
  },

  computed: {
    selectedRangeIntervals() {
      const range = this.ranges.find(r => r.range === this.selectedRange)
      return range ? range.intervals : null
    },
    filterPeriod() {
      return this.$store.getters.filterPeriod
    },
    periodArray() {
      return this.intervalPeriod[this.selectedInterval]
    },
    filters() {
      if (this.interval === 'Season') {
        return this.seasonFilters
      }
      return this.quarterFilters
    }
  },

  watch: {
    range(updated) {
      this.selectedRange = updated
    },
    interval(updated) {
      this.selectedInterval = updated
    },
    periodArray(arr) {
      if (arr && !this.filterPeriod) {
        this.$store.dispatch('filterPeriod', 'All')
      }
    }
  },

  mounted() {
    this.selectedRange = this.range
    this.selectedInterval = this.interval
  },

  methods: {
    showFilter(interval) {
      return (
        (interval === 'Season' && this.showSeasonFilter) ||
        (interval === 'Quarter' && this.showQuarterFilter)
      )
    },
    hasFilter(interval) {
      return (
        this.interval === interval &&
        (interval === 'Season' || interval === 'Quarter')
      )
    },
    intervalLabel(interval) {
      if (this.filterPeriod === 'All') {
        return this.interval
      } else {
        return this.filterPeriod
      }
    },
    handleRangeChange(range) {
      this.$store.dispatch('filterPeriod', null)
      this.$emit('onRangeChange', range)
      this.$store.dispatch('si/emissionsVolumePrefix', '')
    },
    handleIntervalChange(interval) {
      const hasFilter = this.hasFilter(interval)
      if (hasFilter && this.interval === interval) {
        if (interval === 'Season') {
          this.showSeasonFilter = true
        }
        if (interval === 'Quarter') {
          this.showQuarterFilter = true
        }
      } else {
        this.showSeasonFilter = false
        this.showQuarterFilter = false
        this.$store.dispatch('filterPeriod', 'All')
        this.$store.dispatch('si/emissionsVolumePrefix', '')
        this.$emit('onIntervalChange', interval)
      }
    },
    handleFilterPeriodClick(period) {
      this.$store.dispatch('filterPeriod', period)
      this.$store.dispatch('compareDifference', false)
      this.$store.dispatch('compareDates', [])
      this.showSeasonFilter = false
      this.showQuarterFilter = false
    },
    handleClickAway() {
      this.showSeasonFilter = false
      this.showQuarterFilter = false
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~/assets/scss/responsive-mixins.scss';
@import '~/assets/scss/variables.scss';

.data-options-bar {
  .buttons {
    background-color: rgba(255, 255, 255, 0.5);

    @include desktop {
      background-color: transparent;
    }
  }
  @include desktop {
    padding: $app-padding / 2 $app-padding;
    display: flex;
    align-items: center;
  }
}
.button {
  font-size: 11px;
  border-radius: 0;
  position: relative;

  &.is-rounded {
    min-width: 45px;
  }

  @include desktop {
    border-radius: 290486px;
  }

  .filter-caret {
    margin-left: 5px;
  }
}
.range-buttons {
  @include desktop {
    margin-bottom: 0;
    margin-right: $app-padding;
  }
}
.filter-period-buttons {
  @include desktop {
    margin-left: 1rem;
  }
}
.dropdown-item {
  &.is-selected {
    background-color: #c74523;
    color: #fff;
  }
}
.filter-menu {
  min-width: 80px;
  text-align: left;
  display: block;
}
</style>
