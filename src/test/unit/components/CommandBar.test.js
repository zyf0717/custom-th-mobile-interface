import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CommandBar from '../../../components/CommandBar.vue'

describe('CommandBar', () => {
  it('emits events for controls and mixer toggle', async () => {
    const wrapper = mount(CommandBar, {
      props: {
        commandBarBusy: false,
        micControlledByKod: true,
        showMixerControls: true,
      },
    })

    await wrapper.get('[data-test="command-vocals"]').trigger('click')
    await wrapper.get('[data-test="command-play"]').trigger('click')
    await wrapper.get('[data-test="command-tone-up"]').trigger('click')
    await wrapper.get('[data-test="command-toggle-mixer"]').trigger('click')

    expect(wrapper.emitted('vocals')).toHaveLength(1)
    expect(wrapper.emitted('play')).toHaveLength(1)
    expect(wrapper.emitted('tone-up')).toHaveLength(1)
    expect(wrapper.emitted('toggle-mixer')).toHaveLength(1)
  })

  it('disables mic controls when mic is not controlled by KOD', () => {
    const wrapper = mount(CommandBar, {
      props: {
        commandBarBusy: false,
        micControlledByKod: false,
        showMixerControls: true,
      },
    })

    expect(wrapper.get('[data-test="command-mic-down"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-test="command-mic-up"]').attributes('disabled')).toBeDefined()
  })

  it('disables all command buttons while busy', () => {
    const wrapper = mount(CommandBar, {
      props: {
        commandBarBusy: true,
        micControlledByKod: true,
        showMixerControls: true,
      },
    })

    expect(wrapper.get('[data-test="command-reset"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-test="command-mute"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-test="command-tone-reset"]').attributes('disabled')).toBeDefined()
  })
})
