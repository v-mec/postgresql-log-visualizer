import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  FormControl,
  FormLabel,
  HStack,
  Text,
  Checkbox,
  VStack,
  Select,
  Input,
  FormHelperText,
} from '@chakra-ui/react';
import { useSettings } from '../contexts';

interface SettingsDrawerProps {
  isOpen: boolean;
  isReadOnly: boolean;
  onClose: () => void;
}

function SettingsDrawer(props: SettingsDrawerProps) {
  const { isOpen, onClose, isReadOnly } = props;
  const { settings, updateSettings } = useSettings();

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Graph settings</DrawerHeader>

        <DrawerBody>
          <VStack spacing={8} align="start">
            <FormControl>
              <FormLabel>Layout algorithm</FormLabel>
              <Select
                value={settings.layout}
                onChange={(event) =>
                  updateSettings({ ...settings, layout: event.target.value })
                }
              >
                <option value="cose">CoSE</option>
                <option value="fcose">fCoSE</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Label font size</FormLabel>
              <HStack spacing={4}>
                <Slider
                  min={0}
                  max={10}
                  value={settings.fontSize}
                  onChange={(value) =>
                    updateSettings({ ...settings, fontSize: value })
                  }
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                <Text width={10}>{settings.fontSize}</Text>
              </HStack>
            </FormControl>
            <FormControl>
              <FormLabel>Node size multiplier</FormLabel>
              <HStack spacing={4}>
                <Slider
                  isDisabled={isReadOnly}
                  min={0}
                  max={50}
                  value={settings.nodeMultiplier}
                  step={10}
                  onChange={(value) =>
                    updateSettings({ ...settings, nodeMultiplier: value })
                  }
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                <Text width={10}>{settings.nodeMultiplier}x</Text>
              </HStack>
              <FormHelperText>
                Sets how much is node size affected by the number of
                occurrences.
              </FormHelperText>
            </FormControl>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.target as HTMLFormElement;
                const formData = new FormData(form);
                const threshold = Number(formData.get('threshold'));
                updateSettings({ ...settings, threshold });
              }}
            >
              <FormControl>
                <FormLabel>Sequence threshold</FormLabel>
                <Input
                  name="threshold"
                  type="number"
                  defaultValue={settings.threshold}
                  isDisabled={isReadOnly}
                />
                <FormHelperText>
                  Sequences that occurred less times than specified will be
                  ignored.
                </FormHelperText>
              </FormControl>
            </form>
            <Checkbox
              isDisabled={isReadOnly}
              isChecked={settings.isTransactionView}
              onChange={(event) =>
                updateSettings({
                  ...settings,
                  isTransactionView: event.target.checked,
                })
              }
            >
              Transaction view
            </Checkbox>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

export default SettingsDrawer;
